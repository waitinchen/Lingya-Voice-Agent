/**
 * 工具函數
 */

/**
 * 將音頻格式轉換（如果需要）
 */
export function convertAudioFormat(audioData, targetFormat = 'wav') {
  // 音頻格式轉換邏輯
  // 這裡可以整合 ffmpeg 或其他音頻處理庫
  return audioData;
}

/**
 * 格式化對話歷史
 */
export function formatConversationHistory(messages) {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * 延遲函數
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成唯一 ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 檢查環境變數
 */
export function checkEnvVars(required = []) {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少必要的環境變數: ${missing.join(', ')}`);
  }
}

