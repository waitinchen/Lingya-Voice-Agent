/**
 * 表達替換器
 * 將正式表達替換為更符合角色性格的口語化表達
 */

/**
 * 應用表達替換規則
 * @param {string} text - 原始文本
 * @param {Object} expressionMap - 表達映射表
 * @returns {string} 替換後的文本
 */
export function applyExpressionReplacements(text, expressionMap = {}) {
  if (!text || typeof text !== "string") {
    return text;
  }

  if (!expressionMap || Object.keys(expressionMap).length === 0) {
    return text;
  }

  let result = text;

  // 按照長度排序（從長到短），避免短匹配覆蓋長匹配
  const sortedExpressions = Object.keys(expressionMap).sort(
    (a, b) => b.length - a.length
  );

  // 應用替換（使用正則表達式進行全局替換）
  for (const original of sortedExpressions) {
    const replacement = expressionMap[original];
    if (original && replacement) {
      // 使用詞邊界匹配，避免部分匹配
      const regex = new RegExp(
        `\\b${original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "g"
      );
      result = result.replace(regex, replacement);
    }
  }

  return result;
}

/**
 * 檢查是否包含禁止短語
 * @param {string} text - 文本
 * @param {Array<string>} forbiddenPhrases - 禁止短語列表
 * @returns {boolean} 如果包含禁止短語返回 true
 */
export function containsForbiddenPhrase(text, forbiddenPhrases = []) {
  if (!text || typeof text !== "string") {
    return false;
  }

  if (!forbiddenPhrases || forbiddenPhrases.length === 0) {
    return false;
  }

  const lowerText = text.toLowerCase();

  for (const phrase of forbiddenPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return true;
    }
  }

  return false;
}

