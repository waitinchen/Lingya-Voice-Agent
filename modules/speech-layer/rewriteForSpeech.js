/**
 * 語音轉譯層主函數
 * 將 LLM 生成的文字轉換為更口語化、更符合角色性格的語音文本
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { applyPunctuationFixes, cleanExcessivePunctuation } from "./helpers/punctuationFixer.js";
import { injectTailParticles, injectMiddleParticles } from "./helpers/tailParticleAdder.js";
import { applyExpressionReplacements, containsForbiddenPhrase } from "./helpers/expressionReplacer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 緩存配置
const configCache = new Map();

/**
 * 載入角色配置
 * @param {string} personaId - 角色 ID（如 "RONG-001"）
 * @returns {Object|null} 角色配置對象，如果載入失敗返回 null
 */
function loadPersonaConfig(personaId) {
  if (!personaId) {
    console.warn("⚠️ 未提供 personaId，使用默認配置");
    return null;
  }

  // 檢查緩存
  if (configCache.has(personaId)) {
    return configCache.get(personaId);
  }

  try {
    // 使用 process.cwd() 作为基准路径，确保在 Railway 等环境中也能找到配置文件
    const configPath = path.join(
      process.cwd(),
      "modules",
      "speech-layer",
      "personaStyleConfigs",
      `${personaId}.json`
    );

    // 如果上面的路径不存在，尝试使用 __dirname（本地开发环境）
    let finalConfigPath = configPath;
    if (!fs.existsSync(finalConfigPath)) {
      const altPath = path.join(
        __dirname,
        "personaStyleConfigs",
        `${personaId}.json`
      );
      if (fs.existsSync(altPath)) {
        finalConfigPath = altPath;
      } else {
        console.warn(`⚠️ 找不到角色配置: ${configPath} 或 ${altPath}`);
        return null;
      }
    }

    const configContent = fs.readFileSync(finalConfigPath, "utf-8");
    const config = JSON.parse(configContent);

    // 緩存配置
    configCache.set(personaId, config);

    console.log(`✅ 載入角色配置: ${personaId} (${config.personaName || "未知"})`);
    return config;
  } catch (error) {
    console.error(`❌ 載入角色配置失敗 (${personaId}):`, error);
    console.error(`   錯誤堆疊:`, error.stack);
    return null;
  }
}

/**
 * 根據情緒獲取對應的語氣風格
 * @param {Object} config - 角色配置
 * @param {Array<string>} emotionTags - 情緒標籤列表
 * @returns {Object} 語氣風格配置
 */
function getEmotionStyle(config, emotionTags = []) {
  if (!config || !config.emotionStyles) {
    return {};
  }

  // 優先順序：playful > teasing > flirty > confident
  const priorityOrder = ["playful", "teasing", "flirty", "confident"];

  for (const tag of priorityOrder) {
    if (emotionTags.includes(tag) && config.emotionStyles[tag]) {
      return config.emotionStyles[tag];
    }
  }

  return {};
}

/**
 * 語音轉譯主函數
 * @param {string} text - LLM 生成的原始文本
 * @param {string} personaId - 角色 ID（默認 "RONG-001"）
 * @param {Object} options - 選項
 * @param {Array<string>} options.emotionTags - 情緒標籤列表
 * @returns {string} 轉譯後的語音文本
 */
export function rewriteForSpeech(text, personaId = "RONG-001", options = {}) {
  try {
    if (!text || typeof text !== "string") {
      console.warn("⚠️ rewriteForSpeech: 文本為空或無效");
      return text || "";
    }

    const { emotionTags = [] } = options;

    // 載入角色配置
    const config = loadPersonaConfig(personaId);

    if (!config) {
      // 如果沒有配置，只做基本的標點清理
      return cleanExcessivePunctuation(text);
    }

  // 檢查是否包含禁止短語
  if (containsForbiddenPhrase(text, config.forbiddenPhrases || [])) {
    console.warn("⚠️ 檢測到禁止短語，使用 fallback 回應");
    return config.fallbackResponse || text;
  }

  let output = text;

  // 根據情緒獲取語氣風格
  const emotionStyle = getEmotionStyle(config, emotionTags);

  // Step 1: 應用表達替換
  if (config.expressionMap && Object.keys(config.expressionMap).length > 0) {
    output = applyExpressionReplacements(output, config.expressionMap);
  }

  // Step 2: 應用標點符號優化
  // 優先使用情緒風格的標點規則，如果沒有則使用默認規則
  const punctuationRules = emotionStyle.punctuation || config.punctuationRules || {};
  if (Object.keys(punctuationRules).length > 0) {
    output = applyPunctuationFixes(output, punctuationRules);
  }

  // Step 3: 清理多餘的標點符號
  output = cleanExcessivePunctuation(output);

  // Step 4: 注入語助詞
  // 優先使用情緒風格的語助詞，如果沒有則使用默認語助詞
  const tailParticles = emotionStyle.tailParticles || config.tailParticles || [];
  if (tailParticles.length > 0) {
    const injectionRules = config.injectionRules || {};
    output = injectTailParticles(output, tailParticles, injectionRules);
    
    // 可選：在中間也插入語助詞（增加自然感）
    if (injectionRules.positions && injectionRules.positions.includes("middle")) {
      output = injectMiddleParticles(output, tailParticles, {
        probability: (injectionRules.probability || 0.4) * 0.5, // 中間插入的概率較低
      });
    }
  }

    // Step 5: 最終清理（移除多餘空格）
    output = output.trim().replace(/\s+/g, " ");

    console.log(`🎭 語音轉譯: "${text.substring(0, 30)}..." → "${output.substring(0, 30)}..."`);
    
    return output;
  } catch (error) {
    // 如果轉譯過程發生任何錯誤，記錄並返回原始文本
    console.error(`❌ 語音轉譯過程發生錯誤:`, error);
    console.error(`   錯誤堆疊:`, error.stack);
    console.warn(`⚠️ 使用原始文本，跳過轉譯`);
    return text || "";
  }
}

/**
 * 批量轉譯多個文本
 * @param {Array<string>} texts - 文本數組
 * @param {string} personaId - 角色 ID
 * @param {Object} options - 選項
 * @returns {Array<string>} 轉譯後的文本數組
 */
export function rewriteBatchForSpeech(texts, personaId = "RONG-001", options = {}) {
  if (!Array.isArray(texts)) {
    return [];
  }

  return texts.map((text) => rewriteForSpeech(text, personaId, options));
}

