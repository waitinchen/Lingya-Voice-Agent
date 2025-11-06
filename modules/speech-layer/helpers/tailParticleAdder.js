/**
 * 語助詞注入器
 * 在句尾隨機添加語助詞，增加口語感
 */

/**
 * 隨機選擇一個語助詞
 * @param {Array<string>} tailParticles - 語助詞列表
 * @returns {string|null} 選中的語助詞，如果列表為空則返回 null
 */
export function pickRandomTailParticle(tailParticles = []) {
  if (!tailParticles || tailParticles.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * tailParticles.length);
  return tailParticles[randomIndex];
}

/**
 * 在句尾注入語助詞
 * @param {string} text - 原始文本
 * @param {Array<string>} tailParticles - 語助詞列表
 * @param {Object} options - 選項
 * @param {number} options.probability - 注入概率（0-1，默認 0.4）
 * @param {number} options.minLength - 最小文本長度（默認 5）
 * @param {number} options.maxLength - 最大文本長度（默認 50）
 * @returns {string} 處理後的文本
 */
export function injectTailParticles(
  text,
  tailParticles = [],
  options = {}
) {
  if (!text || typeof text !== "string") {
    return text;
  }

  const {
    probability = 0.4,
    minLength = 5,
    maxLength = 50,
  } = options;

  // 如果文本太短或太長，不添加語助詞
  if (text.length < minLength || text.length > maxLength) {
    return text;
  }

  // 如果沒有語助詞列表，不處理
  if (!tailParticles || tailParticles.length === 0) {
    return text;
  }

  // 根據概率決定是否添加語助詞
  if (Math.random() > probability) {
    return text;
  }

  // 檢查是否已經有語助詞（避免重複）
  const hasTailParticle = tailParticles.some((particle) =>
    text.trim().endsWith(particle)
  );

  if (hasTailParticle) {
    return text;
  }

  // 隨機選擇一個語助詞
  const particle = pickRandomTailParticle(tailParticles);

  if (!particle) {
    return text;
  }

  // 移除末尾的標點符號，然後添加語助詞
  const trimmed = text.trim();
  const lastChar = trimmed[trimmed.length - 1];

  // 如果末尾是標點符號，先移除
  if (/[。，！？～]/.test(lastChar)) {
    return trimmed.slice(0, -1) + particle;
  }

  // 直接添加語助詞
  return trimmed + particle;
}

/**
 * 在句子中間插入語助詞（增強自然感）
 * @param {string} text - 原始文本
 * @param {Array<string>} tailParticles - 語助詞列表（用於中間插入的簡化版本）
 * @param {Object} options - 選項
 * @returns {string} 處理後的文本
 */
export function injectMiddleParticles(
  text,
  tailParticles = [],
  options = {}
) {
  if (!text || typeof text !== "string") {
    return text;
  }

  const { probability = 0.2 } = options;

  // 如果文本太短，不處理
  if (text.length < 10) {
    return text;
  }

  // 根據概率決定是否在中間插入
  if (Math.random() > probability) {
    return text;
  }

  // 找到合適的位置插入語助詞（在逗號後或短句後）
  const sentences = text.split(/[，,。.]/);
  if (sentences.length < 2) {
    return text;
  }

  // 隨機選擇一個句子插入語助詞
  const sentenceIndex = Math.floor(Math.random() * (sentences.length - 1));
  const particle = pickRandomTailParticle(tailParticles);

  if (!particle) {
    return text;
  }

  // 在選中的句子後插入語助詞
  const result = [...sentences];
  result[sentenceIndex] = result[sentenceIndex].trim() + particle;

  // 重新組合句子（保持原標點）
  return result.join("，");
}


