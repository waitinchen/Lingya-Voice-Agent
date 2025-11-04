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

// ========================================
// 🎧 花小軟靈魂聲線系統：Voice Mapping
// ========================================
/**
 * 語氣標籤到 VoiceID 的映射表
 * 每個語氣對應一個專屬的 Cartesia Voice ID
 */
const VOICE_MAP = {
  warm: "7d74df0d-5645-441e-ad73-7c83a6032960",      // 溫柔、情感充沛
  whisper: "95716f5f-6280-41a5-a0b0-54cd4b5cf9bf",  // 輕聲、貼耳語氣
  playful: "65bd7b95-1aa7-4f33-a125-49bdf7373c55",  // 撒嬌、俏皮語氣
  excited: "06ba0621-5325-4303-b90a-e18e04f7cdbc",  // 活潑、有彈性
  neutral: "56029d8e-d54a-46a0-b7d5-65fc6bbff62d",  // 中性、平穩
};

const DEFAULT_VOICE = VOICE_MAP["neutral"];

/**
 * 花小軟的聲紋基底模板
 * 「soft, feminine, youthful, tender, playful tone」
 * 讓聲音更「靈氣」而非「合成感」
 */
const STYLE_TEMPLATE = "soft, feminine, youthful, tender, playful tone, gentle rhythm, natural breathing";

/**
 * 載入語氣標籤配置
 */
function loadToneTags() {
  try {
    const toneTagsPath = path.join(process.cwd(), "config", "tone-tags.json");
    if (fs.existsSync(toneTagsPath)) {
      const toneTagsData = fs.readFileSync(toneTagsPath, "utf-8");
      return JSON.parse(toneTagsData);
    }
  } catch (error) {
    console.warn("⚠️  無法載入 tone-tags.json，使用默認配置:", error.message);
  }
  // 默認配置
  return {
    warm: { emoji: "💞", label: "溫柔" },
    whisper: { emoji: "🌙", label: "輕語" },
    playful: { emoji: "🎀", label: "俏皮" },
    excited: { emoji: "✨", label: "興奮" },
    neutral: { emoji: "🌸", label: "平靜" },
  };
}

// 緩存 tone tags 配置
let toneTagsCache = null;

/**
 * 根據語氣標籤獲取對應的 toneTag 圖標和標籤
 * @param {Array<string>} emotionTags - 語氣標籤列表
 * @returns {Object} { emoji: string, label: string }
 */
export function getToneTag(emotionTags = []) {
  if (!toneTagsCache) {
    toneTagsCache = loadToneTags();
  }
  
  // 優先順序：warm > whisper > playful > excited > flirty > neutral
  const priorityOrder = ['warm', 'whisper', 'playful', 'excited', 'flirty', 'neutral'];
  
  for (const priorityTag of priorityOrder) {
    if (emotionTags.includes(priorityTag) && toneTagsCache[priorityTag]) {
      return toneTagsCache[priorityTag];
    }
  }
  
  // 如果沒有匹配的，嘗試其他標籤
  for (const tag of emotionTags) {
    if (toneTagsCache[tag]) {
      return toneTagsCache[tag];
    }
  }
  
  // 默認返回 neutral
  return toneTagsCache["neutral"] || { emoji: "🌸", label: "平靜" };
}

/**
 * 根據語氣標籤選擇對應的 VoiceID
 * @param {Array<string>} tags - 語氣標籤列表
 * @returns {string} VoiceID
 */
function selectVoiceByTags(tags = []) {
  if (!tags || tags.length === 0) {
    return process.env.CARTESIA_VOICE_ID || DEFAULT_VOICE;
  }

  // 優先順序：warm > whisper > playful > excited > neutral
  const priorityOrder = ['warm', 'whisper', 'playful', 'excited', 'neutral'];
  
  for (const priorityTag of priorityOrder) {
    if (tags.includes(priorityTag) && VOICE_MAP[priorityTag]) {
      return VOICE_MAP[priorityTag];
    }
  }

  // 如果沒有匹配的，使用環境變數或默認
  return process.env.CARTESIA_VOICE_ID || DEFAULT_VOICE;
}

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

    // 根據語氣標籤選擇 VoiceID
    const selectedVoiceId = selectVoiceByTags(finalTags);
    
    console.log(`🎙️ 呼叫 Cartesia TTS`);
    console.log(`   標籤: [${finalTags.join(", ") || "無"}]`);
    console.log(`   VoiceID: ${selectedVoiceId}`);
    console.log(`   ${getVoiceParamsDescription(finalTags)}`);
    
    // 構建請求參數
    const requestParams = {
      modelId: process.env.CARTESIA_TTS_MODEL_ID || "sonic-3",
      transcript: script, // 使用處理後的文字
      voice: {
        mode: "id",
        id: selectedVoiceId, // 使用根據標籤選擇的 VoiceID
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
    // 檢查必要的環境變數
    if (!process.env.CARTESIA_API_KEY) {
      throw new Error("CARTESIA_API_KEY environment variable is missing");
    }
    if (!process.env.CARTESIA_VOICE_ID) {
      throw new Error("CARTESIA_VOICE_ID environment variable is missing");
    }
    
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
    
    // 根據語氣標籤選擇 VoiceID
    const selectedVoiceId = selectVoiceByTags(finalTags);
    
    console.log(`🎙️ 呼叫 Cartesia TTS`);
    console.log(`   標籤: [${finalTags.join(", ") || "無"}]`);
    console.log(`   VoiceID: ${selectedVoiceId}`);
    console.log(`   文字層參數: speed=${speed.toFixed(2)}, volume=${volume.toFixed(2)}`);
    console.log(`   ${getVoiceParamsDescription(finalTags)}`);
    
    // 構建請求參數
    const requestParams = {
      modelId: process.env.CARTESIA_TTS_MODEL_ID || "sonic-3",
      transcript: script, // 使用處理後的文字（可能包含 textCues）
      voice: {
        mode: "id",
        id: selectedVoiceId, // 使用根據標籤選擇的 VoiceID
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
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Cartesia TTS returned empty audio buffer");
    }
    
    console.log(`✅ Cartesia TTS 成功生成音頻，大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    return audioBuffer;
  } catch (err) {
    console.error("❌ Cartesia TTS 錯誤：", err.message);
    if (err.response) {
      console.error("   錯誤詳情:", err.response);
    }
    if (err.statusCode) {
      console.error("   HTTP 狀態碼:", err.statusCode);
    }
    if (err.stack) {
      console.error("   錯誤堆疊:", err.stack);
    }
    // 不要返回 null，而是拋出錯誤，讓調用者知道具體問題
    throw err;
  }
}
