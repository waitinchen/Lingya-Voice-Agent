/**
 * Cartesia 語音合成模組（官方 SDK 版本）
 * Step ②-B：升級為 Cartesia 聲線覺醒版
 * 使用 @cartesia/cartesia-js 官方 SDK
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CartesiaClient } from "@cartesia/cartesia-js";
import { mergeVoiceParams, getVoiceParamsDescription } from "./voice-params.js";

dotenv.config();

const client = new CartesiaClient({
  apiKey: process.env.CARTESIA_API_KEY,
});

/**
 * 使用 Cartesia 官方 SDK 將文字轉換為語音（支持情緒標籤）
 * @param {string} text - 要合成的文字
 * @param {string} outputPath - 輸出音檔路徑（可選）
 * @param {Object} options - 選項
 * @param {Array<string>} options.tags - 情緒標籤列表
 * @param {string} options.emotion - 舊版情緒參數（向後兼容）
 * @returns {Promise<string|null>} - 成功返回檔案路徑，失敗返回 null
 */
export async function synthesizeSpeechCartesia(
  text,
  outputPath = null,
  options = {}
) {
  try {
    const { tags = [], emotion } = options;
    
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
    
    // 應用情緒標籤（文字層處理）
    const { script, speed, volume } = applyEmotion({
      text,
      tags: finalTags,
    });

    // ========================================
    // 🩵 語氣標籤轉譯層：計算聲音參數
    // ========================================
    const voiceParams = mergeVoiceParams(finalTags);

    // 如果沒有指定輸出路徑，使用默認路徑
    if (!outputPath) {
      const timestamp = Date.now();
      outputPath = path.join(process.cwd(), "outputs", `soft-cartesia-${timestamp}.wav`);
    }

    // 確保 outputs 目錄存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`🎙️ 呼叫 Cartesia TTS`);
    console.log(`   標籤: [${finalTags.join(", ") || "無"}]`);
    console.log(`   ${getVoiceParamsDescription(finalTags)}`);

    // 構建請求參數
    const requestParams = {
      modelId: process.env.CARTESIA_TTS_MODEL_ID || "sonic-3",
      transcript: script, // 使用處理後的文字
      voice: {
        mode: "id",
        id: process.env.CARTESIA_VOICE_ID,
      },
      language: process.env.CARTESIA_LANGUAGE || "zh",
      outputFormat: {
        container: "wav",
        sampleRate: parseInt(process.env.CARTESIA_SAMPLE_RATE) || 44100,
        encoding: "pcm_s16le",
      },
      save: true,
    };
    
    // 如果 Cartesia SDK 支持 voice settings，加入聲音參數
    if (voiceParams.appliedTags.length > 0) {
      console.log(`   💡 聲音層參數已計算（pitch=${voiceParams.pitch.toFixed(2)}, rate=${voiceParams.rate.toFixed(2)}, volume=${voiceParams.volume.toFixed(2)}），待 Cartesia API 支持時自動應用`);
    }
    
    const response = await client.tts.bytes(requestParams);

    // 處理響應：SDK 返回的可能是流（Stream）
    let audioBuffer;
    if (Buffer.isBuffer(response)) {
      audioBuffer = response;
    } else if (response instanceof Uint8Array) {
      audioBuffer = Buffer.from(response);
    } else if (typeof response.getReader === 'function' || response[Symbol.asyncIterator]) {
      // 處理流（Stream）
      const chunks = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }
      audioBuffer = Buffer.concat(chunks);
    } else if (response.arrayBuffer) {
      audioBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // 嘗試將流轉換為 Buffer
      const chunks = [];
      const reader = response.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        audioBuffer = Buffer.concat(chunks);
      } finally {
        reader.releaseLock();
      }
    }
    
    fs.writeFileSync(outputPath, audioBuffer);

    console.log("✅ 語音檔案生成：", outputPath);
    return outputPath;
  } catch (err) {
    console.error("❌ Cartesia TTS 錯誤：", err.message);
    if (err.response) {
      console.error("   錯誤詳情:", err.response);
    }
    return null;
  }
}

/**
 * 使用 Cartesia 官方 SDK 將文字轉換為語音 Buffer（支持情緒標籤）
 * @param {string} text - 要合成的文字
 * @param {Object} options - 選項
 * @param {Array<string>} options.tags - 情緒標籤列表（whisper, breathy, excited, angry, smile, fast, slow, louder, quieter, pause-XXX 等）
 * @param {string} options.emotion - 舊版情緒參數（向後兼容）
 * @returns {Promise<Buffer|null>} - 成功返回音頻 Buffer，失敗返回 null
 */
export async function synthesizeSpeechCartesiaToBuffer(text, options = {}) {
  try {
    const { tags = [], emotion } = options;
    
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
    
    // 應用情緒標籤（文字層處理）
    const { script, speed, volume, sfx, pauses } = applyEmotion({
      text,
      tags: finalTags,
    });
    
    // ========================================
    // 🩵 語氣標籤轉譯層：計算聲音參數
    // ========================================
    const voiceParams = mergeVoiceParams(finalTags);
    
    console.log(`🎙️ 呼叫 Cartesia TTS`);
    console.log(`   標籤: [${finalTags.join(", ") || "無"}]`);
    console.log(`   文字層參數: speed=${speed.toFixed(2)}, volume=${volume.toFixed(2)}`);
    console.log(`   ${getVoiceParamsDescription(finalTags)}`);
    
    // 構建請求參數
    const requestParams = {
      modelId: process.env.CARTESIA_TTS_MODEL_ID || "sonic-3",
      transcript: script, // 使用處理後的文字（可能包含 textCues）
      voice: {
        mode: "id",
        id: process.env.CARTESIA_VOICE_ID,
      },
      language: process.env.CARTESIA_LANGUAGE || "zh",
      outputFormat: {
        container: "wav",
        sampleRate: parseInt(process.env.CARTESIA_SAMPLE_RATE) || 44100,
        encoding: "pcm_s16le",
      },
      save: false, // Buffer 模式不需要保存檔案
    };
    
    // 如果 Cartesia SDK 支持 voice settings 或 generation config，加入聲音參數
    // 注意：當前 Cartesia API 可能不支持這些參數，但我們先準備好接口
    // 未來如果支持，可以這樣傳遞：
    // if (client.tts.bytes.supportsVoiceParams) {
    //   requestParams.voiceSettings = {
    //     pitch: voiceParams.pitch,
    //     rate: voiceParams.rate,
    //     volume: voiceParams.volume,
    //   };
    // }
    
    // 目前先記錄參數，用於調試和未來擴展
    if (voiceParams.appliedTags.length > 0) {
      console.log(`   💡 聲音層參數已計算（pitch=${voiceParams.pitch.toFixed(2)}, rate=${voiceParams.rate.toFixed(2)}, volume=${voiceParams.volume.toFixed(2)}），待 Cartesia API 支持時自動應用`);
    }
    
    const response = await client.tts.bytes(requestParams);

    // 處理響應：SDK 返回的可能是流（Stream）
    let audioBuffer;
    if (Buffer.isBuffer(response)) {
      audioBuffer = response;
    } else if (response instanceof Uint8Array) {
      audioBuffer = Buffer.from(response);
    } else if (typeof response.getReader === 'function' || response[Symbol.asyncIterator]) {
      // 處理流（Stream）
      const chunks = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }
      audioBuffer = Buffer.concat(chunks);
    } else if (response.arrayBuffer) {
      audioBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // 嘗試將流轉換為 Buffer
      const chunks = [];
      const reader = response.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        audioBuffer = Buffer.concat(chunks);
      } finally {
        reader.releaseLock();
      }
    }
    
    return audioBuffer;
  } catch (err) {
    console.error("❌ Cartesia TTS 錯誤：", err.message);
    if (err.response) {
      console.error("   錯誤詳情:", err.response);
    }
    return null;
  }
}
