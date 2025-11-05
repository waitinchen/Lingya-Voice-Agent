/**
 * WebSocket 語音服務模組
 * 處理 WebSocket 連接和消息路由
 */

import { VoiceSession, SessionState } from "./voice-session.js";

/**
 * WebSocket 語音服務器類
 */
export class VoiceWebSocketServer {
  constructor(expressApp) {
    this.app = expressApp;
    this.sessions = new Map(); // sessionId -> VoiceSession
    this.setup();
  }

  /**
   * 設置 WebSocket 端點
   */
  setup() {
    // 使用 express-ws 設置 WebSocket 端點
    this.app.ws("/api/voice-ws", (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    console.log("✅ WebSocket 語音端點已設置: /api/voice-ws");
  }

  /**
   * 處理新連接
   */
  async handleConnection(ws, req) {
    console.log("🔌 新的 WebSocket 連接建立");
    
    // 創建新會話
    const session = new VoiceSession(ws);
    this.sessions.set(session.id, session);
    
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
    });

    // 設置錯誤處理
    ws.on("error", (error) => {
      console.error(`❌ WebSocket 錯誤 (${session.id}):`, error);
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

    // TODO: Phase 2 - 實現增量 STT
    // 暫時不發送 transcription_partial，等待 audio_end
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

    // TODO: Phase 2 - 實現 STT 處理
    // 暫時返回一個提示消息
    this.sendMessage(session, {
      type: "status",
      data: {
        stage: "transcribing",
        message: "正在識別語音...",
      },
    });
  }

  /**
   * 處理 interrupt 消息
   */
  async handleInterrupt(session, msg) {
    const reason = msg.data?.reason || "user_interrupt";
    console.log(`⏹️  處理打斷請求 (${session.id}): ${reason}`);

    session.interrupt(reason);

    // TODO: Phase 5 - 實現完整的打斷邏輯
    // 發送打斷確認
    this.sendMessage(session, {
      type: "interrupted",
      data: {
        reason,
        timestamp: Date.now(),
      },
    });

    // 重置狀態
    session.setState(SessionState.IDLE);
    session.clearAudioBuffer();
  }

  /**
   * 處理 reset 消息
   */
  async handleReset(session, msg) {
    const clearHistory = msg.data?.clearHistory !== false;
    console.log(`🔄 處理重置請求 (${session.id}): clearHistory=${clearHistory}`);

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

      session.ws.send(JSON.stringify(messageWithId));
      return true;
    } catch (error) {
      console.error(`❌ 發送消息失敗 (${session.id}):`, error);
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

