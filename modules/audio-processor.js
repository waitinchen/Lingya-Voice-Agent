/**
 * 音頻處理模組
 * 處理音頻片段的合併和轉換
 */

import fs from "fs";
import path from "path";

/**
 * 合併多個 Base64 音頻片段
 * 注意：這是簡化版本，實際應用中可能需要根據音頻格式進行更複雜的處理
 * 
 * @param {Array<Object>} audioChunks - 音頻片段數組
 * @param {string} audioChunks[].audio - Base64 編碼的音頻數據
 * @param {string} audioChunks[].format - 音頻格式 (webm, wav, etc.)
 * @returns {Promise<Buffer>} 合併後的音頻 Buffer
 */
export async function mergeAudioChunks(audioChunks) {
  if (!audioChunks || audioChunks.length === 0) {
    throw new Error("音頻片段數組為空");
  }

  // 如果只有一個片段，直接解碼返回
  if (audioChunks.length === 1) {
    return Buffer.from(audioChunks[0].audio, "base64");
  }

  // 對於多個片段，我們需要合併
  // 注意：WebM 格式的合併需要特殊處理，這裡我們使用簡單的方法
  // 將所有 Base64 字符串解碼並連接
  const buffers = audioChunks.map((chunk) => {
    return Buffer.from(chunk.audio, "base64");
  });

  // 簡單合併：直接連接 Buffer
  // 注意：這對於某些格式可能不正確，但對於 WebM 通常可以工作
  const mergedBuffer = Buffer.concat(buffers);

  console.log(
    `🔊 合併 ${audioChunks.length} 個音頻片段，總大小: ${(mergedBuffer.length / 1024).toFixed(2)} KB`
  );

  return mergedBuffer;
}

/**
 * 將音頻片段保存為臨時文件
 * @param {Buffer} audioBuffer - 音頻 Buffer
 * @param {string} format - 音頻格式 (webm, wav, etc.)
 * @returns {Promise<string>} 臨時文件路徑
 */
export async function saveAudioToTempFile(audioBuffer, format = "webm") {
  const tempDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `ws-audio-${Date.now()}.${format}`);
  fs.writeFileSync(tempFilePath, audioBuffer);

  console.log(`💾 音頻已保存到臨時文件: ${tempFilePath}`);
  return tempFilePath;
}

/**
 * 清理臨時音頻文件
 * @param {string} filePath - 文件路徑
 */
export async function cleanupTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  已清理臨時文件: ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠️  清理臨時文件失敗: ${error.message}`);
  }
}

/**
 * 獲取音頻格式的 MIME 類型
 * @param {string} format - 音頻格式
 * @returns {string} MIME 類型
 */
export function getAudioMimeType(format) {
  const mimeTypes = {
    webm: "audio/webm",
    wav: "audio/wav",
    mp4: "audio/mp4",
    mpeg: "audio/mpeg",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };

  return mimeTypes[format.toLowerCase()] || "audio/webm";
}

