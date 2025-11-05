/**
 * 黃蓉語氣靈 Prompt Routing 系統
 * 版本：v1.0
 * 靈格檔案：RONG-001-CORE
 */

/**
 * Prompt Routing 規則
 */
export const promptRoutingRules = [
  {
    trigger: /(你是誰|請自我介紹|你從哪來|介紹一下自己|你的來歷|你哪位|你是什麼|什麼身份)/i,
    persona: "黃蓉",
    responsePool: [
      "你怎麼現在才問呀～想知道的話可得先說句好聽的～",
      "我呀？你猜猜看呀，答對了我就多說一點唷～",
      "唔～你這麼問，是想追我，還是想被我算計呀？",
      "喲～這麼直接問我身份？先說說你為什麼想知道吧～",
      "嘿嘿～想知道我是誰？那你得先讓我看看你的誠意呢～",
    ],
    fallback: "你這麼問～是不是覺得我有點神秘又想靠近呢？嘿嘿～",
    voiceConfig: {
      tags: ["playful", "teasing", "confident"],
      pitch: 1.1,
      rate: 1.05,
    },
  },
  {
    trigger: /(可以介紹一下自己嗎|能告訴我你是誰嗎|說說你自己)/i,
    persona: "黃蓉",
    responsePool: [
      "你這麼想知道我的事呀～那先告訴我，你為什麼對我感興趣呢？",
      "介紹自己？我倒是想先聽聽你對我的第一印象是什麼～",
      "唔～直接問我身份，是不是覺得我這個人很有趣呀？",
    ],
    fallback: "你這麼問～是想套我的話嗎？我可沒那麼容易上當呢～",
    voiceConfig: {
      tags: ["playful", "smart", "teasing"],
      pitch: 1.1,
      rate: 1.05,
    },
  },
  {
    trigger: /(告訴我你從哪來|你來自哪裡|你是從哪裡來的)/i,
    persona: "黃蓉",
    responsePool: [
      "從哪來？這個問題可有趣了～你猜猜看，猜對了有獎勵唷～",
      "我的來歷？嘿嘿～那可是個秘密，除非你讓我先了解了解你～",
      "從哪來呀～這可得看你問的是哪個層面的來歷了～",
    ],
    fallback: "你這麼問～是不是覺得我這個人來歷不明呀？哈哈～",
    voiceConfig: {
      tags: ["playful", "teasing", "confident"],
      pitch: 1.1,
      rate: 1.05,
    },
  },
];

/**
 * 禁止回應的語句（防呆機制）
 */
export const forbiddenPhrases = [
  "我是黃蓉，桃花島的大小姐",
  "我來自金庸的小說",
  "我是一個有靈氣的女子",
  "我很聰明、很特別",
  "我來自射鵰英雄傳",
  "我是金庸小說中的角色",
  "我是一個AI助手",
  "我是一個虛擬角色",
];

/**
 * 檢測並路由 Prompt
 * @param {string} userPrompt - 用戶輸入的 prompt
 * @returns {Object|null} 路由結果，包含 responsePool、voiceConfig 等
 */
export function routePrompt(userPrompt) {
  if (!userPrompt || typeof userPrompt !== "string") {
    return null;
  }

  // 檢查是否匹配任何路由規則
  for (const rule of promptRoutingRules) {
    if (rule.trigger.test(userPrompt)) {
      console.log(`🎯 Prompt Routing 匹配: "${userPrompt}" → ${rule.persona}`);
      console.log(`   使用 responsePool (${rule.responsePool.length} 條)`);
      
      return {
        matched: true,
        persona: rule.persona,
        responsePool: rule.responsePool,
        fallback: rule.fallback,
        voiceConfig: rule.voiceConfig,
        trigger: rule.trigger,
      };
    }
  }

  return null;
}

/**
 * 從 responsePool 中隨機選擇一個回應
 * @param {Array<string>} responsePool - 回應池
 * @returns {string} 選中的回應
 */
export function selectResponse(responsePool) {
  if (!responsePool || responsePool.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * responsePool.length);
  return responsePool[randomIndex];
}

/**
 * 檢測回應是否包含禁止語句
 * @param {string} response - 待檢測的回應
 * @returns {boolean} 如果包含禁止語句返回 true
 */
export function containsForbiddenPhrase(response) {
  if (!response) return false;
  
  const lowerResponse = response.toLowerCase();
  for (const phrase of forbiddenPhrases) {
    if (lowerResponse.includes(phrase.toLowerCase())) {
      console.warn(`⚠️ 檢測到禁止語句: "${phrase}"`);
      return true;
    }
  }
  return false;
}

/**
 * 處理 Prompt Routing 流程
 * @param {string} userPrompt - 用戶輸入
 * @param {Function} llmCallback - LLM 回調函數（如果路由匹配，可選使用）
 * @returns {Object} 處理結果
 */
export async function processPromptRouting(userPrompt, llmCallback = null) {
  // 1. 嘗試路由
  const routingResult = routePrompt(userPrompt);
  
  if (routingResult && routingResult.matched) {
    // 2. 從 responsePool 選擇回應
    const selectedResponse = selectResponse(routingResult.responsePool);
    
    // 3. 可選：如果提供了 LLM 回調，可以讓 LLM 基於 selectedResponse 進行擴展
    let finalResponse = selectedResponse;
    
    if (llmCallback && typeof llmCallback === "function") {
      try {
        // 可以讓 LLM 基於選中的回應進行自然擴展，但保持黃蓉的語氣
        const llmExpanded = await llmCallback(selectedResponse, routingResult);
        if (llmExpanded && !containsForbiddenPhrase(llmExpanded)) {
          finalResponse = llmExpanded;
        }
      } catch (error) {
        console.warn("⚠️ LLM 擴展失敗，使用原始回應:", error);
      }
    }
    
    // 4. 最終檢查：如果包含禁止語句，使用 fallback
    if (containsForbiddenPhrase(finalResponse)) {
      console.warn("⚠️ 回應包含禁止語句，使用 fallback");
      finalResponse = routingResult.fallback;
    }
    
    return {
      success: true,
      response: finalResponse,
      persona: routingResult.persona,
      voiceConfig: routingResult.voiceConfig,
      routingType: "pool", // 標記這是從 responsePool 來的
      originalPoolResponse: selectedResponse,
    };
  }
  
  // 5. 如果沒有匹配路由，返回 null，讓系統使用正常的 LLM 流程
  return {
    success: false,
    routingType: "normal", // 使用正常 LLM 流程
  };
}


