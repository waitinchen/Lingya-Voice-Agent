/**
 * Cartesia TTS 流式處理模組
 * 支持邊生成邊播放的流式 TTS
 */

import dotenv from "dotenv";
import { mergeVoiceParams, getVoiceParamsDescription } from "./voice-params.js";
import { selectVoiceByTags } from "./tts-cartesia.js";

dotenv.config();

// 延遲導入 Cartesia 客戶端（避免循環依賴）
let getCartesiaClient = null;

async function getClient() {
  if (!getCartesiaClient) {
    const cartesiaModule = await import("./tts-cartesia.js");
    // 由於 tts-cartesia.js 沒有導出 getCartesiaClient，我們需要直接初始化
    const { CartesiaClient } = await import("@cartesia/cartesia-js");
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      throw new Error("CARTESIA_API_KEY environment variable is missing");
    }
    return new CartesiaClient({ apiKey });
  }
  return getCartesiaClient();
}

/**
 * 流式 TTS 處理（支持分塊生成和回調）
 * @param {string} text - 要合成的文字
 * @param {Object} options - 選項
 * @param {Array<string>} options.tags - 情緒標籤列表
 * @param {string} options.emotion - 舊版情緒參數（向後兼容）
 * @param {Function} onChunk - 回調函數，接收每個音頻片段
 * @returns {Promise<Object>} 包含完整音頻 Buffer 和統計信息
 */
export async function synthesizeSpeechCartesiaStream(text, options = {}, onChunk = null) {
  try {
    const { tags = [], emotion, abortSignal, personaId = "RONG-001" } = options;
    
    // 🎭 Step 1: 語音轉譯層 - 將 LLM 文字轉換為口語化表達
    let spokenText = text;
    try {
      const { rewriteForSpeech } = await import("./speech-layer/rewriteForSpeech.js");
      spokenText = rewriteForSpeech(text, personaId, {
        emotionTags: tags,
      });
      if (spokenText && spokenText !== text) {
        console.log(`🎭 語音轉譯完成: "${text.substring(0, 50)}..." → "${spokenText.substring(0, 50)}..."`);
      }
    } catch (rewriteError) {
      console.warn("⚠️ 語音轉譯失敗，使用原始文本:", rewriteError.message);
      if (rewriteError.stack) {
        console.warn("   錯誤堆疊:", rewriteError.stack);
      }
      // 如果轉譯失敗，繼續使用原始文本（確保流程不被阻塞）
      spokenText = text;
    }
    
    // 導入情緒處理模組
    const { applyEmotion } = await import("../helpers/emotion.js");
    
    // 如果有舊版 emotion 參數，轉換為 tags（向後兼容）
    let finalTags = [...tags];
    if (emotion && !tags.length) {
      const emotionToTag = {
        '開心': ['excited', 'smile'],
        '難過': ['softer', 'breathy'],
        '生氣': ['angry', 'louder'],
        '平靜': ['neutral'],
      };
      if (emotionToTag[emotion]) {
        finalTags = emotionToTag[emotion];
      }
    }
    
    // 應用情緒標籤（文字層處理）- 使用轉譯後的文本
    const { script, speed, volume } = applyEmotion({
      text: spokenText, // 使用轉譯後的文本
      tags: finalTags,
    });

    // 計算聲音參數
    const voiceParams = mergeVoiceParams(finalTags);
    
    // 根據語氣標籤選擇 VoiceID
    const selectedVoiceId = selectVoiceByTags(finalTags);
    
    console.log(`🎙️ 呼叫 Cartesia TTS（流式）`);
    console.log(`   標籤: [${finalTags.join(", ") || "無"}]`);
    console.log(`   VoiceID: ${selectedVoiceId}`);
    console.log(`   ${getVoiceParamsDescription(finalTags)}`);
    
    // 構建請求參數
    const requestParams = {
      modelId: process.env.CARTESIA_TTS_MODEL_ID || "sonic-3",
      transcript: script,
      voice: {
        mode: "id",
        id: selectedVoiceId,
      },
      language: process.env.CARTESIA_LANGUAGE || "zh",
      outputFormat: {
        container: "wav",
        sampleRate: parseInt(process.env.CARTESIA_SAMPLE_RATE) || 44100,
        encoding: "pcm_s16le",
      },
      save: false,
    };
    
    // 獲取 Cartesia 客戶端
    const cartesiaClient = await getClient();
    
    console.log(`📡 發送 Cartesia TTS 請求（流式）...`);
    const response = await cartesiaClient.tts.bytes(requestParams);
    
    // 處理流式響應
    const chunks = [];
    let totalSize = 0;
    let chunkIndex = 0;
    
    // 檢查響應類型並處理流
    if (Buffer.isBuffer(response)) {
      // 檢查是否被中止（在處理 Buffer 之前）
      if (abortSignal && abortSignal.aborted) {
        console.log("⏹️  TTS 流式處理被中止（Buffer 模式）");
        throw new Error("TTS stream aborted");
      }
      
      // 如果是 Buffer，直接處理
      chunks.push(response);
      totalSize = response.length;
      
      // 發送單個片段
      if (onChunk && typeof onChunk === "function") {
        onChunk({
          chunk: response,
          chunkIndex: chunkIndex++,
          isLast: true,
          totalSize: response.length,
        });
      }
    } else if (response instanceof Uint8Array) {
      // 檢查是否被中止（在處理 Uint8Array 之前）
      if (abortSignal && abortSignal.aborted) {
        console.log("⏹️  TTS 流式處理被中止（Uint8Array 模式）");
        throw new Error("TTS stream aborted");
      }
      
      // 如果是 Uint8Array，轉換為 Buffer
      const buffer = Buffer.from(response);
      chunks.push(buffer);
      totalSize = buffer.length;
      
      if (onChunk && typeof onChunk === "function") {
        onChunk({
          chunk: buffer,
          chunkIndex: chunkIndex++,
          isLast: true,
          totalSize: buffer.length,
        });
      }
    } else if (typeof response.getReader === 'function' || response[Symbol.asyncIterator]) {
      // 處理流（Stream）- 這是主要情況
      console.log(`📦 處理流式響應...`);
      
      for await (const chunk of response) {
        // 檢查是否被中止
        if (abortSignal && abortSignal.aborted) {
          console.log("⏹️  TTS 流式處理被中止");
          throw new Error("TTS stream aborted");
        }
        
        let audioChunk;
        
        if (Buffer.isBuffer(chunk)) {
          audioChunk = chunk;
        } else if (chunk instanceof Uint8Array) {
          audioChunk = Buffer.from(chunk);
        } else {
          // 嘗試轉換
          audioChunk = Buffer.from(chunk);
        }
        
        chunks.push(audioChunk);
        totalSize += audioChunk.length;
        
        // 調用回調函數發送音頻片段
        if (onChunk && typeof onChunk === "function") {
          onChunk({
            chunk: audioChunk,
            chunkIndex: chunkIndex++,
            isLast: false, // 流式處理中，最後一個片段需要特殊標記
            totalSize: totalSize,
            accumulatedSize: totalSize,
          });
        }
      }
      
      // 標記最後一個片段
      if (chunks.length > 0 && onChunk && typeof onChunk === "function") {
        onChunk({
          chunk: chunks[chunks.length - 1],
          chunkIndex: chunkIndex - 1,
          isLast: true,
          totalSize: totalSize,
          accumulatedSize: totalSize,
        });
      }
    } else if (response.arrayBuffer) {
      // 檢查是否被中止（在處理 ArrayBuffer 之前）
      if (abortSignal && abortSignal.aborted) {
        console.log("⏹️  TTS 流式處理被中止（ArrayBuffer 模式）");
        throw new Error("TTS stream aborted");
      }
      
      // 處理 ArrayBuffer
      const buffer = Buffer.from(await response.arrayBuffer());
      chunks.push(buffer);
      totalSize = buffer.length;
      
      if (onChunk && typeof onChunk === "function") {
        onChunk({
          chunk: buffer,
          chunkIndex: 0,
          isLast: true,
          totalSize: buffer.length,
        });
      }
    } else {
      // 嘗試使用 ReadableStream API
      const reader = response.getReader();
      try {
        while (true) {
          // 檢查是否被中止
          if (abortSignal && abortSignal.aborted) {
            console.log("⏹️  TTS 流式處理被中止");
            reader.cancel(); // 取消讀取
            throw new Error("TTS stream aborted");
          }
          
          const { done, value } = await reader.read();
          if (done) break;
          
          let audioChunk;
          if (Buffer.isBuffer(value)) {
            audioChunk = value;
          } else if (value instanceof Uint8Array) {
            audioChunk = Buffer.from(value);
          } else {
            audioChunk = Buffer.from(value);
          }
          
          chunks.push(audioChunk);
          totalSize += audioChunk.length;
          
          if (onChunk && typeof onChunk === "function") {
            onChunk({
              chunk: audioChunk,
              chunkIndex: chunkIndex++,
              isLast: false,
              totalSize: totalSize,
              accumulatedSize: totalSize,
            });
          }
        }
        
        // 標記最後一個片段
        if (chunks.length > 0 && onChunk && typeof onChunk === "function") {
          onChunk({
            chunk: chunks[chunks.length - 1],
            chunkIndex: chunkIndex - 1,
            isLast: true,
            totalSize: totalSize,
            accumulatedSize: totalSize,
          });
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    // 合併所有片段為完整 Buffer
    const fullAudioBuffer = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
    
    console.log(`✅ TTS 流式處理完成：${chunks.length} 個片段，總大小 ${(totalSize / 1024).toFixed(2)} KB`);
    
    return {
      buffer: fullAudioBuffer,
      chunks: chunks,
      totalSize: totalSize,
      chunkCount: chunks.length,
    };
    
  } catch (error) {
    // 如果是中止錯誤，不記錄為錯誤
    if (error.name === "AbortError" || error.message === "TTS stream aborted") {
      console.log(`⏹️  TTS 流式處理被中止`);
      throw error;
    }
    console.error("❌ Cartesia TTS 流式處理錯誤：", error.message);
    if (error.response) {
      console.error("   錯誤詳情:", error.response);
    }
    throw error;
  }
}

