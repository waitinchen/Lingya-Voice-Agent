/**
 * Cartesia API 測試腳本
 * 用於診斷 TTS 500 錯誤
 */

import dotenv from "dotenv";
import { CartesiaClient } from "@cartesia/cartesia-js";

dotenv.config();

async function testCartesiaAPI() {
  console.log("🧪 開始測試 Cartesia API...\n");

  // 1. 檢查環境變數
  console.log("1️⃣ 檢查環境變數:");
  const apiKey = process.env.CARTESIA_API_KEY;
  const voiceId = process.env.CARTESIA_VOICE_ID;
  const modelId = process.env.CARTESIA_TTS_MODEL_ID || "sonic-3";
  
  console.log(`   CARTESIA_API_KEY: ${apiKey ? `${apiKey.substring(0, 10)}...` : "❌ 未設置"}`);
  console.log(`   CARTESIA_VOICE_ID: ${voiceId || "❌ 未設置"}`);
  console.log(`   CARTESIA_TTS_MODEL_ID: ${modelId}`);
  console.log();

  if (!apiKey) {
    console.error("❌ CARTESIA_API_KEY 未設置！");
    return;
  }

  // 2. 測試 VOICE_MAP 中的 VoiceID
  const VOICE_MAP = {
    warm: "7d74df0d-5645-441e-ad73-7c83a6032960",
    whisper: "95716f5f-6280-41a5-a0b0-54cd4b5cf9bf",
    playful: "65bd7b95-1aa7-4f33-a125-49bdf7373c55",
    excited: "06ba0621-5325-4303-b90a-e18e04f7cdbc",
    neutral: "56029d8e-d54a-46a0-b7d5-65fc6bbff62d",
  };

  console.log("2️⃣ 測試 VoiceID:");
  const testVoiceId = voiceId || VOICE_MAP.neutral;
  console.log(`   使用 VoiceID: ${testVoiceId}`);
  console.log();

  // 3. 初始化客戶端
  console.log("3️⃣ 初始化 Cartesia 客戶端...");
  let client;
  try {
    client = new CartesiaClient({
      apiKey: apiKey,
    });
    console.log("   ✅ 客戶端初始化成功");
  } catch (error) {
    console.error("   ❌ 客戶端初始化失敗:", error.message);
    return;
  }
  console.log();

  // 4. 測試簡單的 TTS 請求
  console.log("4️⃣ 測試 TTS 請求...");
  const testText = "你好，我是花小軟。";
  console.log(`   測試文字: "${testText}"`);
  console.log(`   模型: ${modelId}`);
  console.log(`   VoiceID: ${testVoiceId}`);
  console.log();

  try {
    const requestParams = {
      modelId: modelId,
      transcript: testText,
      voice: {
        mode: "id",
        id: testVoiceId,
      },
      language: "zh",
      outputFormat: {
        container: "wav",
        sampleRate: 44100,
        encoding: "pcm_s16le",
      },
      save: false,
    };

    console.log("📡 發送請求...");
    const response = await client.tts.bytes(requestParams);
    console.log("✅ 收到響應");

    // 處理響應
    let audioBuffer;
    if (Buffer.isBuffer(response)) {
      audioBuffer = response;
      console.log("   ✅ 響應類型: Buffer");
    } else if (response instanceof Uint8Array) {
      audioBuffer = Buffer.from(response);
      console.log("   ✅ 響應類型: Uint8Array");
    } else if (typeof response.getReader === 'function' || response[Symbol.asyncIterator]) {
      console.log("   ✅ 響應類型: Stream");
      const chunks = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }
      audioBuffer = Buffer.concat(chunks);
    } else {
      console.error("   ❌ 未知的響應類型:", typeof response);
      return;
    }

    console.log(`   ✅ 音頻大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    console.log();
    console.log("🎉 測試成功！Cartesia API 正常工作。");

  } catch (error) {
    console.error("❌ TTS 請求失敗:");
    console.error("   錯誤類型:", error.constructor.name);
    console.error("   錯誤消息:", error.message);
    if (error.status) {
      console.error("   HTTP 狀態:", error.status);
    }
    if (error.statusCode) {
      console.error("   HTTP 狀態碼:", error.statusCode);
    }
    if (error.response) {
      console.error("   API 響應:", JSON.stringify(error.response, null, 2));
    }
    if (error.stack) {
      console.error("   錯誤堆疊:", error.stack);
    }
    console.log();
    console.log("💡 可能的解決方案:");
    console.log("   1. 檢查 CARTESIA_API_KEY 是否正確");
    console.log("   2. 檢查 VoiceID 是否有效");
    console.log("   3. 檢查模型 ID 是否正確（應該是 sonic-3 或 sonic-v2）");
    console.log("   4. 檢查網絡連接");
  }
}

testCartesiaAPI().catch(console.error);

