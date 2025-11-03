/**
 * 情緒／語氣標籤處理模組
 * 將標籤轉換為 Cartesia TTS 參數
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 載入預設配置
const presetsPath = path.join(process.cwd(), "config", "emotion-presets.json");
let presets;

try {
  presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
} catch (error) {
  console.error("❌ 無法載入 emotion-presets.json，使用默認配置");
  presets = {
    base: { speed: 1.0, volume: 1.0, textCues: [], sfx: [] },
  };
}

/**
 * 應用情緒標籤到文字和參數
 * @param {Object} params
 * @param {string} params.text - 原始文字
 * @param {Array<string>} params.tags - 情緒標籤列表
 * @returns {Object} { script, speed, volume, sfx, pauses }
 */
export function applyEmotion({ text, tags = [] }) {
  // 1) 初始化參數
  let speed = presets.base.speed || 1.0;
  let volume = presets.base.volume || 1.0;
  let textCues = [...(presets.base.textCues || [])];
  let sfx = [...(presets.base.sfx || [])];
  const pauses = [];

    // 2) 處理標籤（支持標籤別名映射）
  const tagAliases = {
    'calm': 'thoughtful',
    'soft': 'softer',
  };

  for (const raw of tags) {
    const t = String(raw).toLowerCase().trim();

    // 處理 pause-XXX
    const pm = t.match(/^pause-(\d{2,4})$/);
    if (pm) {
      pauses.push(Number(pm[1]));
      continue;
    }

    // 處理標籤別名
    const finalTag = tagAliases[t] || t;

    // 跳過不存在的標籤
    if (!presets[finalTag]) {
      console.warn(`⚠️  未知的情緒標籤: ${t}`);
      continue;
    }

    // 累加參數（使用最終標籤）
    speed += presets[finalTag].speed ?? 0;
    volume += presets[finalTag].volume ?? 0;
    if (presets[finalTag].textCues) {
      textCues.push(...presets[finalTag].textCues);
    }
    if (presets[finalTag].sfx) {
      sfx.push(...presets[finalTag].sfx);
    }
  }

  // 3) 限制範圍（安全欄）
  speed = Math.max(0.8, Math.min(1.3, 1 + speed)); // 最終倍數 0.8-1.3
  volume = Math.max(0.8, Math.min(1.2, 1 + volume)); // 最終倍數 0.8-1.2

  // 4) 清理特殊符号（不利于语音合成）
  let script = text;
  
  // 移除 emoji（包括各种 Unicode emoji 范围）
  script = script.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Emoji Symbols
  script = script.replace(/[\u{1FA00}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A
  script = script.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Miscellaneous Symbols
  script = script.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  script = script.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  script = script.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map Symbols
  script = script.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols and Pictographs
  script = script.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A
  
  // 移除其他特殊符号（音乐符号、星星等）
  script = script.replace(/[🎵🎶🎤🎧🎨🎪🎭🎬🎯🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄🏅🏆🏇🏈🏉🏊🏋🏌🏍🏎🏏🏐🏑🏒🏓🏔🏕🏖🏗🏘🏙🏚🏛🏜🏝🏞🏟🏠🏡🏢🏣🏤🏥🏦🏧🏨🏩🏪🏫🏬🏭🏮🏯🏰🏱🏲🏳🏴🏵🏶🏷🏸🏹🏺]/g, '');
  
  // 移除日文特殊字符（如 づ、♡ 等）
  script = script.replace(/[づ♡♥]/g, '');
  
  // 移除其他装饰性符号（但保留中文常用的波浪号 ～）
  // 移除星星、雪花等装饰性符号（但保留波浪号，因为中文常用）
  script = script.replace(/[❀❁❂❃❄❅❆❇❈❉❊❋✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀]/g, '');
  
  // 清理多余空格
  script = script.replace(/\s{2,}/g, ' ').trim();
  
  // 5) 處理文案注入
  // 在文字前加入 textCues（如果有）
  if (textCues.length > 0) {
    script = `${textCues.join(" ")} ${script}`;
  }

  // 處理停頓（如果有省略號，可以替換為 PAUSE 標記）
  // 注意：Cartesia 可能不直接支持 PAUSE，這裡先用省略號引導韻律
  if (pauses.length > 0 && script.includes("…")) {
    // 可以後續處理，目前先保留省略號
    console.log(`📝 檢測到停頓標籤: ${pauses.join(", ")}ms`);
  }

  return {
    script,
    speed,
    volume,
    sfx: [...new Set(sfx)], // 去重
    pauses,
  };
}

/**
 * 驗證標籤是否有效
 * @param {Array<string>} tags - 標籤列表
 * @returns {Array<string>} 有效的標籤
 */
export function validateTags(tags) {
  const validTags = [];
  for (const tag of tags) {
    const t = tag.toLowerCase().trim();
    if (presets[t] || /^pause-\d{2,4}$/.test(t)) {
      validTags.push(t);
    }
  }
  return validTags;
}

/**
 * 獲取所有可用的標籤
 * @returns {Array<string>} 標籤列表
 */
export function getAvailableTags() {
  return Object.keys(presets).filter((k) => k !== "base");
}

