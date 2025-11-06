/**
 * WebSocket 語音服務模組
 * 處理 WebSocket 連接和消息路由
 */

import { VoiceSession, SessionState } from "./voice-session.js";
import { transcribeFromBase64 } from "./stt.js";
import { analyzeEmotion } from "./llm.js";
import { mergeAudioChunks } from "./audio-processor.js";
import { chatWithLLMStream } from "./llm-stream.js";
import { processPromptRouting } from "./prompt-routing.js";
import { getToneTag } from "./tts-cartesia.js";
import { synthesizeSpeechCartesiaStream } from "./tts-cartesia-stream.js";
import { getPerformanceMonitor } from "./performance-monitor.js";
import { IncrementalSTTProcessor } from "./incremental-stt.js";
import { createErrorRecoveryManager } from "./error-recovery.js";

/**
 * WebSocket 語音服務器類
 */
export class VoiceWebSocketServer {
  constructor(expressApp) {
    this.app = expressApp;
    this.sessions = new Map(); // sessionId -> VoiceSession
    this.incrementalSTTProcessors = new Map(); // sessionId -> IncrementalSTTProcessor
    this.errorRecoveryManagers = new Map(); // sessionId -> ErrorRecoveryManager
    
    // 创建全局错误恢复管理器
    this.globalErrorRecovery = createErrorRecoveryManager({
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
    });
    
    // 延遲設置，避免在構造函數中拋出錯誤
    try {
      this.setup();
    } catch (error) {
      console.error("❌ VoiceWebSocketServer 設置失敗:", error);
      throw error;
    }
  }

  /**
   * 設置 WebSocket 端點
   */
  setup() {
    // 檢查 app.ws 是否可用（express-ws 已正確初始化）
    if (typeof this.app.ws !== "function") {
      console.error("❌ app.ws 不可用，WebSocket 端點無法設置");
      console.warn("⚠️  請確保 express-ws 已正確初始化");
      return;
    }
    
    try {
      // 使用 express-ws 設置 WebSocket 端點
      this.app.ws("/api/voice-ws", (ws, req) => {
        this.handleConnection(ws, req);
      });
      
      console.log("✅ WebSocket 語音端點已設置: /api/voice-ws");
    } catch (error) {
      console.error("❌ 設置 WebSocket 端點失敗:", error);
      throw error;
    }
  }

  /**
   * 處理新連接
   */
  async handleConnection(ws, req) {
    console.log("🔌 新的 WebSocket 連接建立");
    
    // 創建新會話
    const session = new VoiceSession(ws);
    this.sessions.set(session.id, session);
    
    // 記錄 WebSocket 連接
    const performanceMonitor = getPerformanceMonitor();
    performanceMonitor.recordWebSocketConnection();
    
    console.log(`📝 創建新會話: ${session.id} (總會話數: ${this.sessions.size})`);

    // 設置消息處理
    ws.on("message", async (message) => {
      try {
        const msg = JSON.parse(message.toString());
        await this.handleMessage(session, msg);
      } catch (error) {
        console.error("❌ 處理消息失敗:", error);
        this.sendError(session, error.message, "PARSE_ERROR");
      }
    });

    // 設置連接關閉處理
    ws.on("close", (code, reason) => {
      console.log(`🔌 連接關閉: ${session.id} (code: ${code}, reason: ${reason})`);
      this.sessions.delete(session.id);
      session.close("client_disconnect");
      
      // 記錄 WebSocket 斷開
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.recordWebSocketDisconnect();
    });

    // 設置錯誤處理
    ws.on("error", (error) => {
      console.error(`❌ WebSocket 錯誤 (${session.id}):`, error);
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.recordWebSocketError();
      this.sessions.delete(session.id);
      session.close("error");
    });

    // 發送連接確認（等待客戶端發送 connect 消息）
    // 不立即發送，等待客戶端的 connect 消息
  }

  /**
   * 處理消息
   */
  async handleMessage(session, msg) {
    if (!msg.type) {
      return this.sendError(session, "消息缺少 type 字段", "INVALID_MESSAGE");
    }

    console.log(`📨 收到消息 (${session.id}): ${msg.type}`);

    try {
      switch (msg.type) {
        case "connect":
          await this.handleConnect(session, msg.data || {});
          break;
        case "audio_chunk":
          await this.handleAudioChunk(session, msg);
          break;
        case "audio_end":
          await this.handleAudioEnd(session, msg);
          break;
        case "interrupt":
          await this.handleInterrupt(session, msg);
          break;
        case "reset":
          await this.handleReset(session, msg);
          break;
        case "ping":
          this.handlePing(session, msg);
          break;
        case "text":
          await this.handleText(session, msg);
          break;
        default:
          this.sendError(session, `未知的消息類型: ${msg.type}`, "UNKNOWN_MESSAGE_TYPE");
      }
    } catch (error) {
      console.error(`❌ 處理消息 ${msg.type} 失敗:`, error);
      this.sendError(session, error.message, "HANDLER_ERROR");
    }
  }

  /**
   * 處理 connect 消息
   */
  async handleConnect(session, data) {
    console.log(`🔗 處理連接請求 (${session.id}):`, data);

    // 設置用戶信息
    if (data.userIdentity) {
      session.setUserInfo(data.userIdentity, data.userName);
    }
    
    if (data.language) {
      session.setLanguage(data.language);
    }

    // 啟用增量 STT（如果請求）
    if (data.enableIncrementalSTT) {
      session.enableIncrementalSTT = true;
      console.log(`✅ 會話 ${session.id} 啟用增量 STT`);
    }

    // 發送連接確認
    this.sendMessage(session, {
      type: "connected",
      data: {
        sessionId: session.id,
        status: "ready",
        capabilities: {
          streaming: true,
          interrupt: true,
          vad: false, // 暫時不支持 VAD
          incrementalSTT: session.enableIncrementalSTT || false,
        },
      },
    });

    console.log(`✅ 會話 ${session.id} 已就緒`);
  }

  /**
   * 處理 audio_chunk 消息
   */
  async handleAudioChunk(session, msg) {
    if (session.currentState === SessionState.THINKING || session.currentState === SessionState.SPEAKING) {
      // 如果正在處理中，忽略新的音頻片段
      console.log(`⏸️  會話 ${session.id} 正在處理中，忽略音頻片段`);
      return;
    }

    const { audio, format, sampleRate, channels } = msg.data || {};
    
    if (!audio) {
      return this.sendError(session, "缺少 audio 字段", "MISSING_AUDIO");
    }

    // 設置狀態為 listening
    if (session.currentState === SessionState.IDLE) {
      session.setState(SessionState.LISTENING);
    }

    // 添加音頻片段到緩衝區
    session.addAudioChunk({
      audio,
      format: format || "webm",
      sampleRate: sampleRate || 44100,
      channels: channels || 1,
      timestamp: Date.now(),
    });

    // Phase 2: 增量 STT 支持（可选）
    // 如果启用了增量 STT，定期处理累积的音频 chunks
    if (session.enableIncrementalSTT) {
      await this.processIncrementalSTT(session, msg);
    }
  }

  /**
   * 处理增量 STT
   */
  async processIncrementalSTT(session, msg) {
    // 获取或创建增量 STT 处理器
    let processor = this.incrementalSTTProcessors.get(session.id);
    
    if (!processor) {
      processor = new IncrementalSTTProcessor({
        language: session.language,
        minChunkDuration: 1.0, // 至少 1 秒才处理
        maxAccumulateDuration: 3.0, // 最多累积 3 秒
        onPartial: (text) => {
          // 发送增量转录结果
          this.sendMessage(session, {
            type: "transcription_partial",
            data: {
              text: text,
              timestamp: Date.now(),
            },
          });
        },
        onFinal: () => {
          // 最终处理完成
          console.log(`✅ 增量 STT 处理完成 (${session.id})`);
        },
      });
      this.incrementalSTTProcessors.set(session.id, processor);
    }

    // 添加音频 chunk
    const { audio, format } = msg.data || {};
    await processor.addChunk({
      audio,
      format,
      timestamp: Date.now(),
    });
  }

  /**
   * 處理文本消息（用戶從輸入框發送的文字）
   */
  async handleText(session, msg) {
    const text = msg.data?.text || "";
    if (!text || !text.trim()) {
      return this.sendError(session, "文本內容為空", "EMPTY_TEXT");
    }

    console.log(`📝 收到文本消息 (${session.id}): "${text}"`);

    // 檢查是否被打斷
    if (session.isInterrupted) {
      console.log(`⏹️  會話 ${session.id} 已被打斷，取消文本處理`);
      return;
    }

    // 分析情緒（可選，不阻塞）
    let emotion = null;
    try {
      emotion = await analyzeEmotion(text);
      console.log(`😊 檢測到情緒 (${session.id}): ${emotion}`);
    } catch (emotionError) {
      console.warn(`⚠️  情緒分析失敗 (${session.id}):`, emotionError.message);
    }

    // 觸發 LLM 流式處理
    await this.handleLLMStream(session, text, emotion);
  }

  /**
   * 創建超時 Promise（用於超時保護）
   */
  createTimeoutPromise(timeoutMs, errorMessage) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage || `操作超時（${timeoutMs}ms）`));
      }, timeoutMs);
    });
  }

  /**
   * 處理 audio_end 消息
   */
  async handleAudioEnd(session, msg) {
    console.log(`🎤 處理音頻結束 (${session.id})`);

    if (session.currentState !== SessionState.LISTENING) {
      console.log(`⚠️  會話 ${session.id} 不在 listening 狀態，忽略 audio_end`);
      return;
    }

    // 檢查是否被打斷
    if (session.isInterrupted) {
      console.log(`⏹️  會話 ${session.id} 已被打斷，取消 STT 處理`);
      session.clearAudioBuffer();
      session.setState(SessionState.IDLE);
      return;
    }

    // 獲取音頻緩衝區
    const audioChunks = session.getAudioBuffer();
    if (!audioChunks || audioChunks.length === 0) {
      return this.sendError(session, "沒有音頻數據可處理", "NO_AUDIO_DATA");
    }

    // 設置狀態為轉錄中
    session.setState(SessionState.TRANSCRIBING);

    // 發送狀態更新
    this.sendMessage(session, {
      type: "status",
      data: {
        stage: "transcribing",
        message: "正在識別語音...",
      },
    });

    try {
      // 合併音頻片段（尝试使用 ffmpeg，否则使用简单合并）
      console.log(`🔊 合併 ${audioChunks.length} 個音頻片段 (${session.id})`);
      const mergeStartTime = Date.now();
      
      let mergedAudioBuffer;
      try {
        const { mergeAudioWithFFmpeg } = await import('./audio-ffmpeg.js');
        mergedAudioBuffer = await mergeAudioWithFFmpeg(audioChunks, {
          outputFormat: audioChunks[0]?.format || 'webm',
          sampleRate: 16000,
          channels: 1,
        });
        console.log(`✅ 使用 ffmpeg 合併音頻成功`);
      } catch (ffmpegError) {
        console.warn(`⚠️ ffmpeg 合併失敗，使用簡單合併:`, ffmpegError.message);
        mergedAudioBuffer = await mergeAudioChunks(audioChunks);
      }
      
      const mergeDuration = Date.now() - mergeStartTime;
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.recordAudioProcessing(mergedAudioBuffer.length, mergeDuration, true);
      
      // 將 Buffer 轉換為 Base64
      const audioBase64 = mergedAudioBuffer.toString("base64");

      // 進行語音識別（添加 30 秒超時，使用錯誤恢復）
      console.log(`🎤 開始語音識別 (${session.id})...`);
      const sttStartTime = Date.now();
      
      // 获取或创建会话的错误恢复管理器
      let recoveryManager = this.errorRecoveryManagers.get(session.id);
      if (!recoveryManager) {
        recoveryManager = createErrorRecoveryManager({
          maxRetries: 2,
          retryDelay: 500,
        });
        this.errorRecoveryManagers.set(session.id, recoveryManager);
      }
      
      const transcribedText = await recoveryManager.executeWithRetry(
        () => Promise.race([
          transcribeFromBase64(audioBase64, {
            language: session.language,
          }),
          this.createTimeoutPromise(30000, "語音識別超時（30秒），請重試"),
        ]),
        { operation: 'STT', sessionId: session.id }
      );
      
      const sttDuration = Date.now() - sttStartTime;
      performanceMonitor.recordSTT(sttDuration, !!transcribedText);

      // 檢查是否被打斷（在 STT 處理期間）
      if (session.isInterrupted) {
        console.log(`⏹️  會話 ${session.id} 在 STT 處理期間被打斷`);
        session.clearAudioBuffer();
        session.setState(SessionState.IDLE);
        return;
      }

      if (!transcribedText || transcribedText.trim().length === 0) {
        session.setState(SessionState.IDLE);
        session.clearAudioBuffer();
        return this.sendError(
          session,
          "未識別到語音內容。請確保：1) 說話聲音清晰；2) 環境安靜；3) 麥克風正常工作。",
          "NO_SPEECH_DETECTED"
        );
      }

      console.log(`📝 識別結果 (${session.id}): "${transcribedText}"`);

      // 分析情緒（可選，不阻塞）
      let emotion = null;
      try {
        emotion = await analyzeEmotion(transcribedText);
        console.log(`😊 檢測到情緒 (${session.id}): ${emotion}`);
      } catch (emotionError) {
        console.warn(`⚠️  情緒分析失敗 (${session.id}):`, emotionError.message);
      }

      // 更新會話狀態
      session.currentTranscription = transcribedText;

      // 發送最終識別結果
      this.sendMessage(session, {
        type: "transcription_final",
        data: {
          text: transcribedText,
          confidence: 0.95, // 默認置信度（Whisper API 不返回置信度）
          emotion: emotion,
        },
      });

      // 清空音頻緩衝區
      session.clearAudioBuffer();

      // Phase 3: 不自動觸發 LLM，等待用戶確認後再發送
      // 將文字放入輸入框，讓用戶可以編輯後再發送
      // 用戶點擊發送按鈕後，會通過 'text' 消息觸發 LLM 處理
      session.setState(SessionState.IDLE);

    } catch (error) {
      console.error(`❌ STT 處理失敗 (${session.id}):`, error);
      
      // 重置狀態
      session.setState(SessionState.IDLE);
      session.clearAudioBuffer();

      // 發送錯誤消息
      this.sendError(
        session,
        error.message || "語音識別失敗",
        "STT_ERROR"
      );
    }
  }

  /**
   * 處理 LLM 流式處理
   */
  async handleLLMStream(session, transcribedText, emotion) {
    // 檢查是否被打斷
    if (session.isInterrupted) {
      console.log(`⏹️  會話 ${session.id} 已被打斷，取消 LLM 處理`);
      session.setState(SessionState.IDLE);
      return;
    }

    // 創建新的 AbortController（用於中止本次 LLM 請求）
    session.createAbortController();
    const abortSignal = session.getAbortSignal();

    // 設置狀態為思考中
    session.setState(SessionState.THINKING);

    // 發送 LLM 開始消息
    this.sendMessage(session, {
      type: "llm_stream_start",
      data: {
        status: "thinking",
      },
    });

    try {
      // Step 1: 檢查 Prompt Routing
      let routingResult = null;
      let finalReply = null;
      let finalTags = [];
      let routingType = "normal";

      try {
        routingResult = await processPromptRouting(transcribedText, async (poolResponse, routing) => {
          return poolResponse;
        });

        if (routingResult && routingResult.success) {
          console.log(`🎯 使用 Prompt Routing 回應（${routingResult.persona}）`);
          finalReply = routingResult.response;
          finalTags = routingResult.voiceConfig?.tags || [];
          routingType = routingResult.routingType;

          // 檢查是否被打斷
          if (session.isInterrupted) {
            session.setState(SessionState.IDLE);
            return;
          }

          // 發送完整的回應（非流式，因為是預定義回應）
          this.sendMessage(session, {
            type: "llm_stream_chunk",
            data: {
              text: finalReply,
              delta: finalReply,
              fullText: finalReply,
              tags: finalTags,
            },
          });

          // 發送結束消息
          // 確保 finalReply 不是 undefined
          if (!finalReply) {
            console.error(`❌ Prompt Routing 回應為空 (${session.id})`);
            this.sendError(session, "Prompt Routing 回應為空", "ROUTING_EMPTY_RESPONSE");
            session.setState(SessionState.IDLE);
            return;
          }
          
          const toneTag = getToneTag(finalTags);
          this.sendMessage(session, {
            type: "llm_stream_end",
            data: {
              fullText: finalReply || "", // 確保不是 undefined
              tags: finalTags || [],
              toneTag: toneTag || null,
              emotion: emotion || null,
              routingType: routingType || "pool",
            },
          });

          // 更新會話狀態和歷史
          session.currentLLMResponse = finalReply;
          session.currentTags = finalTags;
          session.addToHistory("user", transcribedText);
          session.addToHistory("assistant", finalReply);

          // Phase 4: 觸發 TTS 流式處理
          await this.handleTTSStream(session, finalReply, finalTags, emotion);

          return;
        }
      } catch (routingError) {
        console.warn("⚠️ Prompt Routing 處理失敗，使用正常 LLM 流程:", routingError);
      }

      // Step 2: 如果沒有路由匹配，使用正常 LLM 流式流程
      if (!finalReply) {
        // 獲取對話歷史
        const history = session.history || [];

        // 調用流式 LLM（不設置超時，讓 LLM 正常完成生成）
        // 前端已有 30 秒超時保護，這裡讓 LLM 正常處理
        const llmStartTime = Date.now();
        const result = await chatWithLLMStream(
          transcribedText,
          history,
          {
            emotion: emotion,
            isVoice: true,
            enableTags: true,
            userIdentity: session.userIdentity,
            userName: session.userName,
            abortSignal: abortSignal, // 傳遞 abort signal
          },
          // onChunk 回調：發送增量文字
          (chunk) => {
            // 檢查是否被打斷
            if (session.isInterrupted || (abortSignal && abortSignal.aborted)) {
              return;
            }

            // 發送增量文字片段
            this.sendMessage(session, {
              type: "llm_stream_chunk",
              data: {
                text: chunk.fullText,
                delta: chunk.delta,
                fullText: chunk.fullText,
                tags: chunk.tags || [],
              },
            });
          }
        );
        const llmDuration = Date.now() - llmStartTime;
        const performanceMonitor = getPerformanceMonitor();
        performanceMonitor.recordLLM(llmDuration, !!result && !!result.reply);

        // 檢查是否被打斷
        if (session.isInterrupted) {
          console.log(`⏹️  會話 ${session.id} 在 LLM 處理期間被打斷`);
          session.setState(SessionState.IDLE);
          return;
        }

        finalReply = result.reply;
        finalTags = result.tags || [];
      }

      // 發送 LLM 結束消息
      // 確保 finalReply 不是 undefined
      if (!finalReply) {
        console.error(`❌ finalReply 為空 (${session.id})，無法發送 llm_stream_end`);
        this.sendError(session, "LLM 回應為空", "LLM_EMPTY_RESPONSE");
        session.setState(SessionState.IDLE);
        return;
      }
      
      const toneTag = getToneTag(finalTags);
      this.sendMessage(session, {
        type: "llm_stream_end",
        data: {
          fullText: finalReply || "", // 確保不是 undefined
          tags: finalTags || [],
          toneTag: toneTag || null,
          emotion: emotion || null,
          routingType: routingType || "normal",
        },
      });

      // 更新會話狀態和歷史
      session.currentLLMResponse = finalReply;
      session.currentTags = finalTags;
      session.addToHistory("user", transcribedText);
      session.addToHistory("assistant", finalReply);

      // Phase 4: 觸發 TTS 流式處理
      await this.handleTTSStream(session, finalReply, finalTags, emotion);

    } catch (error) {
      // 如果是中止錯誤，不發送錯誤消息
      if (error.name === "AbortError" || error.message === "LLM stream aborted") {
        console.log(`⏹️  LLM 流式處理被中止 (${session.id})`);
        session.setState(SessionState.IDLE);
        return;
      }

      console.error(`❌ LLM 流式處理失敗 (${session.id}):`, error);

      // 重置狀態
      session.setState(SessionState.IDLE);

      // 發送錯誤消息
      this.sendError(
        session,
        error.message || "LLM 處理失敗",
        "LLM_ERROR"
      );
    }
  }

  /**
   * 處理 TTS 流式處理
   */
  async handleTTSStream(session, text, tags, emotion) {
    // 檢查是否被打斷
    if (session.isInterrupted) {
      console.log(`⏹️  會話 ${session.id} 已被打斷，取消 TTS 處理`);
      session.setState(SessionState.IDLE);
      return;
    }

    // 創建新的 AbortController（用於中止本次 TTS 請求）
    session.createAbortController();
    const abortSignal = session.getAbortSignal();

    // 設置狀態為說話中
    session.setState(SessionState.SPEAKING);

    // 發送 TTS 開始消息
    this.sendMessage(session, {
      type: "tts_stream_start",
      data: {
        status: "synthesizing",
        estimatedDuration: Math.ceil(text.length * 0.1) * 1000, // 粗略估計（100ms/字符）
      },
    });

    try {
      console.log(`🔊 開始 TTS 流式處理 (${session.id}): "${text.substring(0, 50)}..."`);

      // 調用流式 TTS（已內含語音轉譯層，添加 45 秒超時）
      const ttsStartTime = Date.now();
      const result = await Promise.race([
        synthesizeSpeechCartesiaStream(
          text,
          {
            tags: tags,
            emotion: emotion,
            abortSignal: abortSignal, // 傳遞 abort signal
            personaId: "RONG-001", // 指定角色 ID 用於語音轉譯
          },
          // onChunk 回調：發送音頻片段
          (chunkData) => {
            // 檢查是否被打斷
            if (session.isInterrupted || (abortSignal && abortSignal.aborted)) {
              return;
            }

            // 將音頻片段轉換為 Base64
            const audioBase64 = chunkData.chunk.toString("base64");

            // 發送音頻片段
            this.sendMessage(session, {
              type: "tts_stream_chunk",
              data: {
                audio: audioBase64,
                format: "wav",
                sequence: chunkData.chunkIndex,
                isLast: chunkData.isLast,
                chunkSize: chunkData.chunk.length,
                totalSize: chunkData.totalSize,
              },
            });

            console.log(
              `   📦 發送 TTS 片段 ${chunkData.chunkIndex + 1} (${(chunkData.chunk.length / 1024).toFixed(2)} KB)${
                chunkData.isLast ? " [最後]" : ""
              }`
            );
          }
        ),
        this.createTimeoutPromise(45000, "TTS 處理超時（45秒），請重試"),
      ]);
      const ttsDuration = Date.now() - ttsStartTime;
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.recordTTS(ttsDuration, !!result);

      // 檢查是否被打斷
      if (session.isInterrupted) {
        console.log(`⏹️  會話 ${session.id} 在 TTS 處理期間被打斷`);
        session.setState(SessionState.IDLE);
        return;
      }

      // 發送 TTS 結束消息
      this.sendMessage(session, {
        type: "tts_stream_end",
        data: {
          totalChunks: result.chunkCount,
          duration: Math.ceil((result.totalSize / 44100 / 2) * 1000), // 粗略估計（44.1kHz, 16-bit, 單聲道）
          totalSize: result.totalSize,
        },
      });

      console.log(`✅ TTS 流式處理完成 (${session.id}): ${result.chunkCount} 個片段，${(result.totalSize / 1024).toFixed(2)} KB`);

      // 重置狀態為空閒
      session.setState(SessionState.IDLE);

    } catch (error) {
      // 如果是中止錯誤，不發送錯誤消息
      if (error.name === "AbortError" || error.message === "TTS stream aborted") {
        console.log(`⏹️  TTS 流式處理被中止 (${session.id})`);
        session.setState(SessionState.IDLE);
        return;
      }

      console.error(`❌ TTS 流式處理失敗 (${session.id}):`, error);

      // 重置狀態
      session.setState(SessionState.IDLE);

      // 發送錯誤消息
      this.sendError(
        session,
        error.message || "TTS 處理失敗",
        "TTS_ERROR"
      );
    }
  }

  /**
   * 處理 interrupt 消息
   */
  async handleInterrupt(session, msg) {
    const reason = msg.data?.reason || "user_interrupt";
    console.log(`⏹️  處理打斷請求 (${session.id}): ${reason}`);

    // 記錄當前狀態（用於日誌）
    const currentState = session.currentState;

    // 觸發打斷（會中止 AbortController）
    session.interrupt(reason);

    // 根據當前狀態進行不同的清理
    if (currentState === SessionState.LISTENING) {
      // 正在接收音頻，清空緩衝區
      session.clearAudioBuffer();
      console.log(`   🧹 清空音頻緩衝區`);
    } else if (currentState === SessionState.TRANSCRIBING) {
      // 正在轉錄，清空緩衝區
      session.clearAudioBuffer();
      session.currentTranscription = "";
      console.log(`   🧹 清空轉錄狀態`);
    } else if (currentState === SessionState.THINKING) {
      // LLM 正在生成，AbortController 會自動中止請求
      session.currentLLMResponse = "";
      session.currentTags = [];
      console.log(`   🧹 中止 LLM 生成`);
    } else if (currentState === SessionState.SPEAKING) {
      // TTS 正在生成，AbortController 會自動中止請求
      console.log(`   🧹 中止 TTS 生成`);
    }

    // 發送打斷確認
    this.sendMessage(session, {
      type: "interrupted",
      data: {
        reason,
        previousState: currentState,
        timestamp: Date.now(),
      },
    });

    // 重置狀態為空閒
    session.setState(SessionState.IDLE);
    
    // 清空音頻緩衝區（確保沒有殘留）
    session.clearAudioBuffer();

    console.log(`✅ 打斷處理完成 (${session.id}): ${currentState} → IDLE`);
  }

  /**
   * 處理 reset 消息
   */
  async handleReset(session, msg) {
    const clearHistory = msg.data?.clearHistory !== false;
    console.log(`🔄 處理重置請求 (${session.id}): clearHistory=${clearHistory}`);

    // 清理增量 STT 处理器
    if (this.incrementalSTTProcessors.has(session.id)) {
      const processor = this.incrementalSTTProcessors.get(session.id);
      processor.reset();
    }

    // 清理错误恢复管理器
    if (this.errorRecoveryManagers.has(session.id)) {
      const recoveryManager = this.errorRecoveryManagers.get(session.id);
      recoveryManager.reset();
    }

    session.reset(clearHistory);

    this.sendMessage(session, {
      type: "reset_complete",
      data: {
        sessionId: session.id,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * 處理 ping 消息
   */
  handlePing(session, msg) {
    this.sendMessage(session, {
      type: "pong",
      timestamp: msg.timestamp || Date.now(),
    });
  }

  /**
   * 發送消息給客戶端
   */
  sendMessage(session, message) {
    if (!session.isAlive()) {
      console.warn(`⚠️  嘗試向已關閉的會話 ${session.id} 發送消息`);
      return false;
    }

    try {
      const messageWithId = {
        ...message,
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: message.timestamp || Date.now(),
      };

      const json = JSON.stringify(messageWithId);
      const messageSize = Buffer.byteLength(json, 'utf8');
      
      // 記錄 WebSocket 消息
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.recordWebSocketMessage(messageSize);
      
      session.ws.send(json);
      return true;
    } catch (error) {
      console.error(`❌ 發送消息失敗 (${session.id}):`, error);
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.recordWebSocketError();
      return false;
    }
  }

  /**
   * 發送錯誤消息
   */
  sendError(session, message, code = "UNKNOWN_ERROR") {
    console.error(`❌ 錯誤 (${session.id}): ${code} - ${message}`);
    
    this.sendMessage(session, {
      type: "error",
      error: {
        code,
        message,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * 獲取所有活躍會話
   */
  getActiveSessions() {
    return Array.from(this.sessions.values()).filter((s) => s.isAlive());
  }

  /**
   * 獲取會話統計
   */
  getStats() {
    const active = this.getActiveSessions();
    return {
      total: this.sessions.size,
      active: active.length,
      sessions: active.map((s) => s.getState()),
    };
  }
}

