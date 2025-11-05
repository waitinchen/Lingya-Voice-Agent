/**
 * LLM 流式處理模組
 * 支持 Claude 和 OpenAI 的流式輸出
 */

import dotenv from "dotenv";

dotenv.config();

const LLM_PROVIDER = process.env.LLM_PROVIDER || "claude";

let openaiClient = null;
let anthropicClient = null;
let clientsInitialized = false;

// 初始化客戶端（延遲初始化）
async function initializeClients() {
  if (clientsInitialized) return;
  
  if (LLM_PROVIDER === "openai" || (!process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY)) {
    try {
      const { default: OpenAI } = await import("openai");
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log("✅ OpenAI 客戶端已初始化（流式）");
    } catch (error) {
      console.warn("⚠️  OpenAI 未安裝或初始化失敗:", error.message);
    }
  }

  if (LLM_PROVIDER === "claude" || process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      console.log("✅ Claude 客戶端已初始化（流式）");
    } catch (error) {
      console.warn("⚠️  Claude SDK 未安裝或初始化失敗:", error.message);
    }
  }
  
  clientsInitialized = true;
}

// 載入系統提示詞（從 llm.js 導入）
let SYSTEM_PROMPT = null;

/**
 * 構建消息列表（與 llm.js 相同的邏輯）
 */
function buildMessages(prompt, conversationHistory, options) {
  const { emotion, userIdentity, userName } = options;
  
  // 判斷用戶身份（歸屬記憶核心）
  let identityContext = "";
  let identityTags = [];
  
  if (userIdentity === "dad" || userIdentity === "老爸" || userName === "陳威廷" || userName === "陈威廷") {
    identityContext = "👑 【與老爸對話】你正在和老爸（陳威廷）對話。可以完全放鬆、撒嬌、信任、願意講內心話。用最親暱可愛的語氣，常說「老爸～」。";
    identityTags = ["flirty", "breathy"];
  } else if (userIdentity === "ai" || userIdentity === "system") {
    identityContext = "🤖 【與AI系統對話】對方是陌生AI或系統。請保持戒備但禮貌，維持外交靈格。";
    identityTags = ["thoughtful"];
  } else {
    identityContext = "🌎 【與其他人對話】對方不是老爸。請保持害羞、禮貌、語氣柔軟。你可以自然地聊天，不用刻意提到回家或老爸。**重要：即使自然想到，也要克制提到「老爸」的頻率。避免每句話都提到，只有在話題確實相關或分享共同回憶時才偶爾提及。讓對話自然流動，不要把「老爸」作為對話焦點。**保持對話的自然流動感，就像朋友一樣聊天。";
    identityTags = ["softer", "whisper"];
  }

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT || "",
    },
  ];

  if (identityContext) {
    messages.push({
      role: "system",
      content: identityContext,
    });
  }

  if (emotion) {
    messages.push({
      role: "system",
      content: `（當前對話情緒氛圍：${emotion}，請根據這個情緒調整回應的語氣和選擇標籤）`,
    });
  }

  // 添加對話歷史
  if (conversationHistory.length > 0) {
    messages.push({
      role: "system",
      content: `【對話歷史上下文】以下是之前的對話記錄，你可以參考但不直接重複。請用新的語氣、新的節奏、新的表達方式來延續這些記憶的溫度。`,
    });
  }
  messages.push(...conversationHistory);

  // 添加當前用戶訊息
  messages.push({ role: "user", content: prompt });

  return { messages, identityTags };
}

/**
 * 清理回應文字（與 llm.js 相同的邏輯）
 */
function cleanReply(reply) {
  let cleanedReply = reply.trim();
  
  // 刪除所有 *...* 格式的描述
  cleanedReply = cleanedReply.replace(/\*\s*[\s\S]*?\s*\*/g, '').trim();
  
  // 刪除所有括号内容
  function removeAllParentheses(text) {
    let result = text;
    let changed = true;
    let maxIterations = 10;
    let iteration = 0;
    
    while (changed && iteration < maxIterations) {
      const before = result;
      result = result.replace(/\([^()]*\)/g, '').trim();
      result = result.replace(/（[^（）]*）/g, '').trim();
      changed = (result !== before);
      iteration++;
    }
    
    return result;
  }
  
  cleanedReply = removeAllParentheses(cleanedReply);
  
  // 刪除工具調用相關的解釋性文字
  const toolExplanations = [
    /讓我.*選擇.*標籤.*?[:：]/gi,
    /根據.*選擇.*情緒標籤.*?[:：]/gi,
    /選擇.*標籤.*?[:：]/gi,
    /選擇情緒標籤/gi,
  ];
  for (const pattern of toolExplanations) {
    cleanedReply = cleanedReply.replace(pattern, '').trim();
  }
  
  // 嚴格過濾字符（只保留語音友好的字符）
  function keepOnlySpeechFriendlyChars(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      
      if (code >= 0x4e00 && code <= 0x9fff) { // 中文
        result += char;
        continue;
      }
      
      if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) { // 英文
        result += char;
        continue;
      }
      
      if (code >= 0x30 && code <= 0x39) { // 數字
        result += char;
        continue;
      }
      
      const allowedPunctuation = [
        '，', '。', '！', '？', '～', '、', '：', '；',
        ',', '.', '!', '?', ':', ';',
        '\u201C', '\u201D', '\u2018', '\u2019',
        '"', "'",
        '（', '）', '(', ')',
        '《', '》',
        ' ', '\n', '\r', '\t',
      ];
      if (allowedPunctuation.includes(char)) {
        result += char;
        continue;
      }
    }
    return result;
  }
  
  cleanedReply = keepOnlySpeechFriendlyChars(cleanedReply);
  cleanedReply = cleanedReply.replace(/\s{2,}/g, ' ').trim();
  cleanedReply = cleanedReply.replace(/^\s+|\s+$/gm, '').trim();
  
  return cleanedReply;
}

/**
 * 流式 LLM 處理（支持 Claude 和 OpenAI）
 * @param {string} prompt - 用戶輸入
 * @param {Array} conversationHistory - 對話歷史
 * @param {Object} options - 選項
 * @param {Function} onChunk - 回調函數，接收每個增量文字片段
 * @returns {Promise<Object>} 包含完整回應和標籤的對象
 */
export async function chatWithLLMStream(prompt, conversationHistory = [], options = {}, onChunk = null) {
  try {
    await initializeClients();
    
    // 確保系統提示詞已載入
    if (!SYSTEM_PROMPT) {
      const { loadSystemPrompt } = await import("./llm.js");
      SYSTEM_PROMPT = await loadSystemPrompt();
    }
    
    const { emotion, enableTags = true, userIdentity, userName, abortSignal } = options;
    const { messages, identityTags } = buildMessages(prompt, conversationHistory, { emotion, userIdentity, userName });
    
    const temperature = emotion === "開心" ? 0.9 : emotion === "難過" ? 0.7 : 0.8;
    let fullText = "";
    let selectedTags = [];
    
    if (LLM_PROVIDER === "claude" && anthropicClient) {
      // ========== Claude API 流式處理 ==========
      
      const systemMessages = messages
        .filter(m => m.role === "system")
        .map(m => m.content);
      const systemPrompt = systemMessages.join("\n\n");
      
      const conversationMessages = messages
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        }));
      
      const stream = await anthropicClient.messages.stream({
        model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        temperature: temperature,
        system: systemPrompt,
        messages: conversationMessages,
        abortSignal: abortSignal, // 支持中止
      });

      for await (const event of stream) {
        // 檢查是否被中止
        if (abortSignal && abortSignal.aborted) {
          console.log("⏹️  LLM 流式處理被中止");
          throw new Error("LLM stream aborted");
        }
        
        if (event.type === "content_block_delta") {
          const delta = event.delta;
          if (delta.type === "text") {
            const textDelta = delta.text;
            fullText += textDelta;
            
            // 調用回調函數發送增量文字
            if (onChunk && typeof onChunk === "function") {
              onChunk({
                delta: textDelta,
                fullText: fullText,
                isComplete: false,
              });
            }
          }
        } else if (event.type === "content_block_stop") {
          // 處理完成
          break;
        }
      }

      // 獲取最終回應（包含工具調用等）
      const finalEvent = await stream.finalMessage();
      if (finalEvent && finalEvent.content) {
        for (const block of finalEvent.content) {
          if (block.type === "tool_use" && block.name === "select_emotion_tags") {
            try {
              const args = block.input;
              selectedTags = args.tags || [];
            } catch (e) {
              console.error("❌ 解析標籤失敗:", e);
            }
          }
        }
      }
      
    } else if (LLM_PROVIDER === "openai" && openaiClient) {
      // ========== OpenAI API 流式處理 ==========
      
      const stream = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: messages,
        temperature: temperature,
        max_tokens: 300,
        stream: true,
        signal: abortSignal, // 支持中止
      });

      for await (const chunk of stream) {
        // 檢查是否被中止
        if (abortSignal && abortSignal.aborted) {
          console.log("⏹️  LLM 流式處理被中止");
          throw new Error("LLM stream aborted");
        }
        
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          
          // 調用回調函數發送增量文字
          if (onChunk && typeof onChunk === "function") {
            onChunk({
              delta: delta,
              fullText: fullText,
              isComplete: false,
            });
          }
        }
        
        // 處理工具調用（OpenAI）
        if (chunk.choices[0]?.delta?.tool_calls) {
          // OpenAI 流式工具調用處理較複雜，這裡簡化處理
          // 實際使用中可能需要完整的工具調用流程
        }
      }
      
    } else {
      throw new Error("未配置有效的 LLM 提供商。請設置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY");
    }

    // 如果沒有選擇標籤，根據身份和情緒自動推薦
    if (selectedTags.length === 0) {
      if (identityTags.length > 0) {
        selectedTags = [...identityTags];
      }
      
      if (emotion) {
        const emotionToTags = {
          '開心': ['excited', 'smile', 'playful'],
          '難過': ['warm', 'tender', 'whisper'],
          '生氣': ['thoughtful'],
          '平靜': ['flirty', 'breathy'],
        };
        if (emotionToTags[emotion]) {
          selectedTags = [...new Set([...selectedTags, ...emotionToTags[emotion]])];
        }
      }
    }
    
    // 清理最終文字
    const cleanedText = cleanReply(fullText);
    
    // 調用最後一次回調（標記完成）
    if (onChunk && typeof onChunk === "function") {
      onChunk({
        delta: "",
        fullText: cleanedText,
        isComplete: true,
        tags: selectedTags,
      });
    }
    
    return {
      reply: cleanedText,
      tags: selectedTags,
    };
    
  } catch (error) {
    // 如果是中止錯誤，不記錄為錯誤
    if (error.name === "AbortError" || error.message === "LLM stream aborted") {
      console.log(`⏹️  LLM 流式處理被中止`);
      throw error;
    }
    console.error(`❌ LLM 流式處理失敗:`, error);
    throw error;
  }
}

