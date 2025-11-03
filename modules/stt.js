/**
 * OpenAI Whisper 語音識別模組 (Speech-to-Text)
 * Step ③-A：讓花小軟能「聽懂人說話」
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 延遲初始化 OpenAI 客戶端（確保環境變數已載入）
let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is missing or empty");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * 將音頻轉換為文字
 * @param {Buffer|string} audioData - 音頻數據（Buffer 或文件路徑）
 * @param {Object} options - 選項
 * @param {string} options.language - 語言代碼（可選，如 'zh', 'en'）
 * @param {string} options.fileName - 臨時文件名（可選）
 * @returns {Promise<string>} 識別的文字
 */
export async function transcribeAudio(audioData, options = {}) {
  try {
    const { language, fileName = "temp-audio" } = options;

    console.log("🎤 正在識別語音...");

    let audioFile;
    let tempFilePath = null;

    // 處理不同的輸入格式
    if (typeof audioData === "string") {
      // 如果是文件路徑
      if (!fs.existsSync(audioData)) {
        throw new Error(`音頻文件不存在: ${audioData}`);
      }
      audioFile = fs.createReadStream(audioData);
      console.log(`📂 從文件讀取: ${audioData}`);
    } else if (Buffer.isBuffer(audioData)) {
      // 如果是 Buffer，需要先寫入臨時文件
      const tempDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // 保留原始文件擴展名（webm, mp4, wav 等）
      // Whisper API 支持多種格式
      const ext = fileName.includes('.') ? fileName.split('.').pop() : 'webm';
      tempFilePath = path.join(tempDir, `temp-${Date.now()}.${ext}`);
      
      fs.writeFileSync(tempFilePath, audioData);
      console.log(`📂 寫入臨時文件: ${tempFilePath} (${(audioData.length / 1024).toFixed(2)} KB)`);
      audioFile = fs.createReadStream(tempFilePath);
    } else {
      throw new Error("不支援的音頻格式");
    }

    // 使用 OpenAI Whisper API
    // 注意：Whisper API 要求音頻至少 0.1 秒
    const openai = getOpenAIClient();
    let transcription;
    try {
      transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: language || undefined,
        response_format: "text",
      });
    } catch (error) {
      // 處理 Whisper API 的特定錯誤
      const errorMessage = error.message || String(error);
      
      if (errorMessage.includes("too short") || errorMessage.includes("minimum")) {
        throw new Error("音頻時長太短。請確保錄音至少 0.5 秒，並且包含清晰的語音內容。");
      }
      
      if (errorMessage.includes("could not be decoded") || 
          errorMessage.includes("format is not supported") ||
          errorMessage.includes("Unrecognized file format")) {
        console.error(`❌ 音頻格式錯誤，文件: ${tempFilePath || audioData}`);
        throw new Error("音頻格式無法解碼。請確保：1) 錄音至少 0.5 秒；2) 使用清晰的語音；3) 如果持續失敗，請嘗試使用文字輸入。");
      }
      
      // 記錄完整錯誤信息以便調試
      console.error("❌ Whisper API 錯誤詳情:", {
        message: errorMessage,
        status: error.status,
        response: error.response,
      });
      
      throw error;
    }

    // 清理臨時文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    const text = transcription ? transcription.trim() : "";
    console.log(`📝 識別結果: ${text || "(空)"}`);
    
    if (!text || text.length === 0) {
      throw new Error("未識別到語音內容。請確保：1) 說話聲音清晰；2) 環境安靜；3) 麥克風正常工作。");
    }
    
    return text;
  } catch (error) {
    console.error("❌ 語音識別失敗:", error);
    throw error;
  }
}

/**
 * 從 Base64 字串轉換音頻並識別
 * @param {string} base64Audio - Base64 編碼的音頻
 * @param {Object} options - 選項
 * @returns {Promise<string>} 識別的文字
 */
export async function transcribeFromBase64(base64Audio, options = {}) {
  try {
    // 將 Base64 轉換為 Buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");
    
    return await transcribeAudio(audioBuffer, {
      ...options,
      fileName: `base64-audio-${Date.now()}.wav`,
    });
  } catch (error) {
    console.error("❌ Base64 語音識別失敗:", error);
    throw error;
  }
}

