/**
 * LLM 模組 - 簡化測試版
 * Step 4: 先實現簡單的文字回覆函式，不依賴外部服務
 */

/**
 * 生成簡單的回應（模擬 LLM）
 * @param {string} userMessage - 用戶訊息
 * @param {Array} conversationHistory - 對話歷史
 * @param {Object} options - 選項（情緒、語氣等）
 * @returns {Promise<string>} AI 回應
 */
export async function generateResponse(userMessage, conversationHistory = [], options = {}) {
  const { emotion = '平靜', tone = '自然' } = options;

  // 模擬處理時間
  await new Promise(resolve => setTimeout(resolve, 300));

  // 根據用戶訊息生成簡單回應
  const responses = {
    '你好': `你好！我是 Lingya，很高興認識你！`,
    '你好嗎': `我很好，謝謝你的關心！你最近過得如何？`,
    '再見': `再見！希望很快能再和你聊天 🌸`,
  };

  // 如果有預設回應，使用它
  for (const [key, value] of Object.entries(responses)) {
    if (userMessage.includes(key)) {
      return value;
    }
  }

  // 默認回應（帶語氣風格）
  const defaultResponses = {
    '自然': `我聽到了「${userMessage}」。這很有趣呢！`,
    '開心': `「${userMessage}」！聽起來很棒！我很高興你告訴我這個！`,
    '溫柔': `我明白「${userMessage}」這件事。讓我陪在你身邊。`,
  };

  return defaultResponses[tone] || defaultResponses['自然'];
}

/**
 * 分析情緒（簡化版）
 */
export async function analyzeEmotion(text) {
  const emotionKeywords = {
    '開心': ['開心', '高興', '快樂', '哈哈', '😊', '好'],
    '難過': ['難過', '傷心', '悲傷', '哭', '😢'],
    '生氣': ['生氣', '憤怒', '討厭', '氣死', '😠'],
    '平靜': ['還好', '普通', '一般'],
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return emotion;
    }
  }

  return '平靜';
}



