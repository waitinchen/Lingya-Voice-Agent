/**
 * 完整語音對話流程模組
 * Step ③-A：整合語音輸入 → 文字理解 → AI回應 → 語音輸出
 * 
 * 流程：音頻輸入 → STT → LLM → TTS → 音頻輸出
 */

import { transcribeAudio, transcribeFromBase64 } from "./stt.js";
import fs from "fs";
import path from "path";
import { chatWithLLM, analyzeEmotion } from "./llm.js";
import { synthesizeSpeechCartesiaToBuffer } from "./tts-cartesia.js";

/**
 * 處理完整的語音對話流程（支持歸屬記憶）
 * @param {Buffer|Blob|string} audioInput - 音頻輸入（Buffer、Blob 或 Base64 字串）
 * @param {Object} options - 選項
 * @param {string} options.language - 語言（'zh', 'en' 等）
 * @param {Array} options.history - 對話歷史
 * @param {boolean} options.returnAudio - 是否返回音頻（預設 true）
 * @param {string} options.userIdentity - 用戶身份（'dad'/'老爸' 表示陳威廷）
 * @param {string} options.userName - 用戶名稱
 * @returns {Promise<Object>} 包含文字和音頻的回應
 */
export async function processVoiceConversation(audioInput, options = {}) {
  try {
    const {
      language = "zh",
      history = [],
      returnAudio = true,
      userIdentity,
      userName,
    } = options;

    // Step 1: 語音識別 (STT)
    console.log("🎤 Step 1: 語音識別...");
    let transcribedText;
    
    if (typeof audioInput === "string") {
      // 檢查是文件路徑還是 Base64
      if (audioInput.includes("/") || audioInput.includes("\\")) {
        // 文件路徑
        const fileName = path.basename(audioInput);
        transcribedText = await transcribeAudio(audioInput, { 
          language,
          fileName: fileName, // 保留原始文件名和擴展名
        });
      } else {
        // Base64 字串
        transcribedText = await transcribeFromBase64(audioInput, { language });
      }
    } else {
      // Buffer
      transcribedText = await transcribeAudio(audioInput, { language });
    }

    if (!transcribedText || transcribedText.trim().length === 0) {
      return {
        success: false,
        error: "未識別到語音。請確保：1) 錄音時長至少 0.5 秒；2) 說話聲音清晰；3) 麥克風權限已允許。",
        text: "",
        audio: null,
      };
    }

    console.log(`📝 用戶說: "${transcribedText}"`);

    // Step 1.5: 分析情緒（Step ③-B 新增）
    console.log("😊 Step 1.5: 分析情緒...");
    const emotion = await analyzeEmotion(transcribedText);
    console.log(`   檢測到情緒: ${emotion}`);

    // Step 2: LLM 生成回應（使用對話歷史和情緒，支持標籤選擇和身份識別）
    console.log(`🤖 Step 2: AI 生成回應（身份: ${userIdentity || "未知"}, 情感: ${emotion}）...`);
    const llmResult = await chatWithLLM(transcribedText, history, {
      emotion,
      isVoice: true, // 標記這是語音輸入
      enableTags: true, // 啟用情緒標籤選擇
      userIdentity, // 傳遞用戶身份（歸屬記憶核心）
      userName, // 傳遞用戶名稱
    });
    
    const replyText = llmResult.reply;
    const selectedTags = llmResult.tags || [];
    
    console.log(`💬 花小軟回應: "${replyText}"`);
    if (selectedTags.length > 0) {
      console.log(`🏷️  選擇的語氣標籤: [${selectedTags.join(", ")}]`);
    }

    // Step 3: 語音合成 (TTS) - 使用選擇的標籤（Step ③-B 增強）
    let audioBuffer = null;
    if (returnAudio) {
      console.log(`🔊 Step 3: 語音合成（標籤: [${selectedTags.join(", ") || "無"}]）...`);
      audioBuffer = await synthesizeSpeechCartesiaToBuffer(replyText, {
        tags: selectedTags, // 使用 LLM 選擇的標籤
        emotion, // 保留舊版參數以備用
      });
      
      if (audioBuffer) {
        console.log(`✅ 語音生成完成（標籤: [${selectedTags.join(", ") || "無"}]），大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      }
    }

    // 更新對話歷史
    const updatedHistory = [
      ...history,
      { role: "user", content: transcribedText },
      { role: "assistant", content: replyText },
    ];

    return {
      success: true,
      text: replyText,
      transcribedText,
      audio: audioBuffer ? audioBuffer.toString("base64") : null,
      history: updatedHistory,
      emotion, // 返回檢測到的情緒
      tags: selectedTags, // Step ③-B: 返回選擇的標籤
    };
  } catch (error) {
    console.error("❌ 語音對話處理失敗:", error);
    return {
      success: false,
      error: error.message,
      text: "",
      audio: null,
    };
  }
}

