/**
 * OpenAI TTS 語音合成模組
 * Step ②：讓花小軟「開口講話」
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 延遲初始化 OpenAI 客戶端（確保環境變數已載入）
function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * 合成語音
 * @param {string} text - 要轉換為語音的文字
 * @param {string} outputPath - 輸出路徑（可選）
 * @returns {Promise<string|null>} 生成的音檔路徑，失敗返回 null
 */
export async function synthesizeSpeech(text, outputPath = null) {
  try {
    // 如果沒有指定輸出路徑，使用默認路徑
    if (!outputPath) {
      const timestamp = Date.now();
      outputPath = path.join(process.cwd(), "outputs", `soft-voice-${timestamp}.mp3`);
    }

    // 確保 outputs 目錄存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 調用 OpenAI TTS API
    const openai = getOpenAIClient();
    const mp3 = await openai.audio.speech.create({
      model: process.env.TTS_MODEL || "tts-1",
      voice: process.env.TTS_VOICE || "alloy",
      input: text,
    });

    // 將響應轉換為 Buffer 並寫入檔案
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Voice generated: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.error("❌ TTS Error:", err);
    return null;
  }
}

/**
 * 合成語音並返回 Buffer（用於直接傳輸）
 * @param {string} text - 要轉換為語音的文字
 * @returns {Promise<Buffer|null>} 音頻 Buffer，失敗返回 null
 */
export async function synthesizeSpeechToBuffer(text) {
  try {
    const openai = getOpenAIClient();
    const mp3 = await openai.audio.speech.create({
      model: process.env.TTS_MODEL || "tts-1",
      voice: process.env.TTS_VOICE || "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (err) {
    console.error("❌ TTS Error:", err);
    return null;
  }
}
