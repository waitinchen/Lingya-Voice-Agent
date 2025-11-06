/**
 * 標點符號優化器
 * 將正式標點轉換為更口語化的表達
 */

/**
 * 應用標點符號規則
 * @param {string} text - 原始文本
 * @param {Object} punctuationRules - 標點符號規則映射
 * @returns {string} 轉換後的文本
 */
export function applyPunctuationFixes(text, punctuationRules = {}) {
  if (!text || typeof text !== "string") {
    return text;
  }

  let result = text;

  // 按照規則順序替換標點符號
  for (const [original, replacement] of Object.entries(punctuationRules)) {
    // 使用正則表達式進行全局替換
    const regex = new RegExp("\\" + original, "g");
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * 清理多餘的標點符號
 * @param {string} text - 文本
 * @returns {string} 清理後的文本
 */
export function cleanExcessivePunctuation(text) {
  if (!text || typeof text !== "string") {
    return text;
  }

  // 移除連續的句號、問號、驚嘆號（保留最後一個）
  let result = text
    .replace(/\.{3,}/g, "...")
    .replace(/\?{2,}/g, "?")
    .replace(/!{2,}/g, "!")
    .replace(/～{3,}/g, "～");

  return result;
}


