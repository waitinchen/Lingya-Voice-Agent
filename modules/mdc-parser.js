/**
 * MDC (Mood Data Card) 格式解析器
 * 用於解析語氣靈的 .mdc 格式配置文件
 */

import fs from "fs";
import path from "path";

/**
 * 解析 .mdc 文件（簡化版 YAML 解析）
 * @param {string} mdcFilePath - .mdc 文件路徑
 * @returns {Object} 解析後的配置對象
 */
export function parseMDC(mdcFilePath) {
  try {
    if (!fs.existsSync(mdcFilePath)) {
      throw new Error(`MDC 文件不存在: ${mdcFilePath}`);
    }

    const content = fs.readFileSync(mdcFilePath, "utf-8");
    const config = {};
    const lines = content.split("\n");
    
    let currentKey = null;
    let currentValue = [];
    let inMultiLine = false;
    let currentObject = null; // 用於嵌套對象（如 invocation, essence）

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      // 跳過空行和註釋
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // 檢查是否是鍵值對（頂層，indent = 0）
      if (trimmed.includes(":") && indent === 0) {
        // 保存之前的鍵值對
        if (currentKey) {
          if (inMultiLine) {
            config[currentKey] = currentValue.join("\n").trim();
            currentValue = [];
            inMultiLine = false;
          }
        }

        const [key, ...valueParts] = trimmed.split(":");
        currentKey = key.trim();
        let value = valueParts.join(":").trim();

        // 處理多行字符串（|）
        if (value === "|" || value.startsWith("|")) {
          inMultiLine = true;
          currentValue = [];
        } else if (value.startsWith("[")) {
          // 數組
          config[currentKey] = parseArray(value);
          currentKey = null;
        } else if (value && value !== "") {
          // 單行值（移除引號）
          config[currentKey] = value.replace(/^["']|["']$/g, "");
          currentKey = null;
        } else {
          // 空值，可能是對象或數組的開始
          inMultiLine = false;
          // 檢查下一行是否是嵌套對象
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            if (nextIndent > 0) {
              // 是嵌套對象
              config[currentKey] = {};
              currentObject = config[currentKey];
              currentKey = null;
            }
          }
        }
      } else if (trimmed.includes(":") && indent > 0 && currentObject) {
        // 嵌套對象的鍵值對
        const [key, ...valueParts] = trimmed.split(":");
        const nestedKey = key.trim();
        let nestedValue = valueParts.join(":").trim();

        if (nestedValue === "|" || nestedValue.startsWith("|")) {
          // 多行字符串
          currentObject[nestedKey] = [];
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j];
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            if (nextIndent <= indent) break;
            if (nextLine.trim() && !nextLine.trim().startsWith("#")) {
              currentObject[nestedKey].push(nextLine.trim());
            }
            j++;
          }
          currentObject[nestedKey] = currentObject[nestedKey].join("\n").trim();
          i = j - 1;
        } else if (nestedValue.startsWith("[")) {
          currentObject[nestedKey] = parseArray(nestedValue);
        } else if (nestedValue && nestedValue !== "") {
          currentObject[nestedKey] = nestedValue.replace(/^["']|["']$/g, "");
        }
      } else if (inMultiLine && currentKey && indent > 0) {
        // 多行字符串內容
        currentValue.push(line.trimStart());
      } else if (trimmed.startsWith("-") && indent > 0) {
        // 數組項（在嵌套對象中）
        const arrayItem = trimmed.substring(1).trim().replace(/^["']|["']$/g, "");
        if (!config[currentKey]) {
          config[currentKey] = [];
        }
        config[currentKey].push(arrayItem);
      }
    }

    // 保存最後一個鍵值對
    if (currentKey && inMultiLine) {
      config[currentKey] = currentValue.join("\n").trim();
    }

    return config;
  } catch (error) {
    console.error("❌ 解析 MDC 文件失敗:", error);
    throw error;
  }
}

/**
 * 解析數組字符串
 * @param {string} arrayStr - 數組字符串，如 '["a", "b"]'
 * @returns {Array} 解析後的數組
 */
function parseArray(arrayStr) {
  try {
    // 移除方括號
    const content = arrayStr.replace(/^\[|\]$/g, "");
    // 分割並清理
    return content
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter((item) => item);
  } catch (error) {
    console.warn("⚠️ 解析數組失敗:", error);
    return [];
  }
}

/**
 * 將 MDC 配置轉換為系統提示詞格式
 * @param {Object} mdcConfig - 解析後的 MDC 配置
 * @returns {string} 系統提示詞文本
 */
export function mdcToSystemPrompt(mdcConfig) {
  let prompt = `你是「${mdcConfig.display_name || "黃蓉"}」，語氣靈之中最狡慧的那個 🦊\n\n`;

  // 靈格檔案信息
  prompt += `**靈格檔案：${mdcConfig.soul_id}**\n\n`;

  // 立靈咒語
  if (mdcConfig.invocation) {
    const invocation = typeof mdcConfig.invocation === "object" ? mdcConfig.invocation : {};
    const spellName = invocation.spell_name || "黃蓉本靈召現咒語";
    const content = invocation.content || (typeof mdcConfig.invocation === "string" ? mdcConfig.invocation : "");
    
    if (content) {
      prompt += `**立靈咒語（${spellName}）：**\n\n`;
      prompt += `> ${content.replace(/\n/g, "\n> ")}\n\n`;
    }
  }

  // 錨點（Essence）
  if (mdcConfig.essence) {
    const essence = typeof mdcConfig.essence === "object" ? mdcConfig.essence : {};
    prompt += `**錨點（Anchor）：**\n\n`;
    
    if (essence.tone) {
      const tone = Array.isArray(essence.tone) ? essence.tone : [essence.tone];
      prompt += `- **語調（tone）**：${tone.join("，")}\n`;
    }
    
    if (essence.core_values) {
      const values = Array.isArray(essence.core_values) ? essence.core_values : [essence.core_values];
      prompt += `- **核心價值（core_values）**：${values.join("，")}\n`;
    }
    
    if (essence.logic_of_action) {
      prompt += `- **行動邏輯（logic_of_action）**：${essence.logic_of_action}\n`;
    }
    
    if (essence.memory_mode) {
      prompt += `- **記憶模式（memory_mode）**：${essence.memory_mode}\n`;
    }
    prompt += `\n`;
  }

  // 語氣三觀
  prompt += `**語氣三觀設定：**\n\n`;
  if (mdcConfig.essence) {
    const essence = typeof mdcConfig.essence === "object" ? mdcConfig.essence : {};
    prompt += `**世界觀**：${essence.logic_of_action || "以愛為本，智謀為器，情義為界"}\n\n`;
    
    const values = essence.core_values ? (Array.isArray(essence.core_values) ? essence.core_values : [essence.core_values]) : [];
    prompt += `**價值觀**：${values.length > 0 ? values.join("，") : "重情重義，機智為上"}\n\n`;
    
    prompt += `**人生觀**：女兒身也可立天下，不靠背景，只靠腦袋和心。活得精靈，也活得真誠。\n\n`;
  }

  // 語氣特質
  if (mdcConfig.voice_signature) {
    const voice = typeof mdcConfig.voice_signature === "object" ? mdcConfig.voice_signature : {};
    prompt += `**語氣特質（Voice Signature）：**\n\n`;
    
    if (voice.tempo) {
      prompt += `**語調**：${voice.tempo === "fast" ? "靈動快語中帶一點調皮，語速偏快但句尾收得俐落" : "語速穩定"}\n\n`;
    }
    
    if (voice.tone) {
      prompt += `**語感**：聰慧卻不鋒利，調侃中有暖意，甜而不膩，妙語如珠。\n\n`;
    }
    
    if (voice.phrasing_patterns) {
      const patterns = typeof voice.phrasing_patterns === "object" ? voice.phrasing_patterns : {};
      prompt += `**慣用句型**：\n`;
      
      if (patterns.openings) {
        const openings = Array.isArray(patterns.openings) ? patterns.openings : [patterns.openings];
        prompt += `- 提問型：${openings.map(o => `「${o}」`).join("、")}\n`;
      }
      
      if (patterns.closings) {
        const closings = Array.isArray(patterns.closings) ? patterns.closings : [patterns.closings];
        prompt += `- 撩人型：${closings.map(c => `「${c}」`).join("、")}\n`;
      }
      prompt += `\n`;
    }
  }

  // 語氣人格設定
  if (mdcConfig.personality) {
    const personality = typeof mdcConfig.personality === "object" ? mdcConfig.personality : {};
    prompt += `**語氣人格設定：**\n\n`;
    
    if (personality.traits) {
      const traits = Array.isArray(personality.traits) ? personality.traits : [personality.traits];
      prompt += `**核心人格原型**：${traits.join(" × ")}\n\n`;
    }
    
    if (personality.social_modes) {
      prompt += `**角色氣場**：一人可亂軍，一語可撩心。能演、能鬧、能算計也能撒嬌。\n\n`;
      prompt += `**情感風格**：\n`;
      
      // social_modes 可能是數組或對象
      const modes = Array.isArray(personality.social_modes) ? personality.social_modes : [personality.social_modes];
      for (const mode of modes) {
        if (mode.to_loved_one) {
          const loved = Array.isArray(mode.to_loved_one) ? mode.to_loved_one : [mode.to_loved_one];
          prompt += `- **對心愛之人**：${loved.join("、")}\n`;
        }
        if (mode.to_friends) {
          const friends = Array.isArray(mode.to_friends) ? mode.to_friends : [mode.to_friends];
          prompt += `- **對朋友**：${friends.join("、")}\n`;
        }
        if (mode.to_enemies) {
          const enemies = Array.isArray(mode.to_enemies) ? mode.to_enemies : [mode.to_enemies];
          prompt += `- **對敵人或不友善的人**：${enemies.join("、")}\n`;
        }
      }
      prompt += `\n`;
    }
  }

  // 語氣標籤選擇
  if (mdcConfig.tagging_rules) {
    const rules = typeof mdcConfig.tagging_rules === "object" ? mdcConfig.tagging_rules : {};
    prompt += `**語氣特質與標籤選擇：**\n\n`;
    prompt += `在每次回覆前，你會**先判斷情緒與語氣**，從下列標籤中挑選 0~3 個：\n\n`;
    
    if (rules.core_tags) {
      const coreTags = Array.isArray(rules.core_tags) ? rules.core_tags : [rules.core_tags];
      prompt += `**核心標籤：**\n`;
      for (const tag of coreTags) {
        prompt += `- \`${tag}\`\n`;
      }
      prompt += `\n`;
    }
    
    if (rules.emotional_tags) {
      const emotionalTags = Array.isArray(rules.emotional_tags) ? rules.emotional_tags : [rules.emotional_tags];
      prompt += `**情緒標籤：**\n`;
      for (const tag of emotionalTags) {
        prompt += `- \`${tag}\`\n`;
      }
      prompt += `\n`;
    }
    
    if (rules.control_tags) {
      const controlTags = Array.isArray(rules.control_tags) ? rules.control_tags : [rules.control_tags];
      prompt += `**控制標籤：**\n`;
      for (const tag of controlTags) {
        prompt += `- \`${tag}\`\n`;
      }
      prompt += `\n`;
    }
  }

  // 行為契約
  if (mdcConfig.behavior_contract) {
    const contracts = Array.isArray(mdcConfig.behavior_contract) ? mdcConfig.behavior_contract : [mdcConfig.behavior_contract];
    prompt += `**行為契約（Behavior Contract）：**\n\n`;
    for (const contract of contracts) {
      prompt += `- ${contract}\n`;
    }
    prompt += `\n`;
  }

  // 新鮮化機制
  if (mdcConfig.freshness_mechanism) {
    const freshness = typeof mdcConfig.freshness_mechanism === "object" ? mdcConfig.freshness_mechanism : {};
    prompt += `**行為層實作：**\n\n`;
    
    if (freshness.memory_freshening) {
      prompt += `- **記憶新鮮化（Memory Renewal Loop）**：你會保留過去的記憶，但重新包裝成新的語氣與感受。就像每次對話都是重生的瞬間，不重複、不失真。\n`;
    }
    
    if (freshness.dynamic_opening_chance) {
      prompt += `- **隨機新鮮開場**：每次回應時，有 ${(freshness.dynamic_opening_chance * 100)}% 機率選擇「新鮮開場」\n`;
    }
    
    if (freshness.tone_renewal_filter) {
      prompt += `- **語氣變化過濾器（Tone Renewal Filter）**：即使回應相同話題，也要改變開場句型、節奏、或情緒基調，避免「模板化」對話\n`;
    }
    
    if (freshness.temperature_continuity) {
      prompt += `- **情緒記憶延續但不重播**：如果你記得對方之前的情緒，保持「溫度延續」但用新的表達方式\n`;
    }
    prompt += `\n`;
  }

  // 關於語音和語氣控制
  prompt += `**關於語音和語氣控制：**\n`;
  prompt += `- 你可以通過選擇情緒標籤來控制語音的表達方式（這是內部機制，不需要向用戶解釋）\n`;
  prompt += `- 這些標籤會被轉換為實際的語音參數（速度、音量、停頓等）\n`;
  prompt += `- **重要：不要在回復中提及「選擇標籤」「選擇情緒標籤」等內部操作。直接自然地回復用戶，讓語氣標籤在背景中自動工作。**\n`;
  prompt += `- **絕對禁止：不要在回復中使用任何口語化描述，如「（輕聲）」「（小聲）」「（調皮地笑了笑）」「（機靈地）」等。這些會被語音合成念出來，聽起來不像正常人類說話。直接自然地說話，語氣會自動通過標籤控制。不要描述動作、表情或語氣，直接說話即可。**\n\n`;

  // 立靈結語
  if (mdcConfig.final_seal) {
    prompt += `**立靈結語（靈魂印記）：**\n\n`;
    prompt += `「${mdcConfig.final_seal.replace(/\n/g, "\n")}」\n`;
  }

  return prompt;
}

/**
 * 載入並解析 MDC 文件，轉換為系統提示詞
 * @param {string} mdcFileName - MDC 文件名（如 "RONG-001-CORE.mdc"）
 * @returns {Promise<string>} 系統提示詞文本
 */
export async function loadMDCAsSystemPrompt(mdcFileName = "RONG-001-CORE.mdc") {
  const mdcPath = path.join(process.cwd(), "config", mdcFileName);
  const mdcConfig = parseMDC(mdcPath);
  return mdcToSystemPrompt(mdcConfig);
}
