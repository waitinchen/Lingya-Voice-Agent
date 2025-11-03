/**
 * 快速測試 TTS 語音合成
 * 驗證花小軟能否「開口講話」
 */

import dotenv from "dotenv";
import { synthesizeSpeech, synthesizeSpeechToBuffer } from "./modules/tts.js";
import fs from "fs";

dotenv.config();

async function testTTS() {
  console.log("🧪 測試 OpenAI TTS 語音合成...\n");

  // 檢查環境變數
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("xxxxxxx")) {
    console.error("❌ 請在 .env 文件中設定正確的 OPENAI_API_KEY");
    process.exit(1);
  }

  console.log("✅ API Key 已設定");
  console.log(`📦 使用模型: ${process.env.TTS_MODEL || "tts-1"}`);
  console.log(`🎤 使用音色: ${process.env.TTS_VOICE || "alloy"}\n`);

  // 測試文字
  const testText = "你好，我是花小軟。很高興認識你！";

  // 測試 1: 生成檔案
  console.log("📝 測試 1: 生成語音檔案...");
  console.log(`   輸入文字: "${testText}"`);

  try {
    const startTime = Date.now();
    const filePath = await synthesizeSpeech(testText, "outputs/test-voice.mp3");
    const duration = Date.now() - startTime;

    if (filePath && fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`\n✅ 測試成功！`);
      console.log(`   📁 檔案路徑: ${filePath}`);
      console.log(`   📊 檔案大小: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   ⏱️  生成時間: ${duration}ms`);
      console.log(`\n💡 提示: 可以用媒體播放器打開 ${filePath} 收聽語音\n`);
    } else {
      console.error("\n❌ 檔案生成失敗");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ 測試失敗:", error.message);
    process.exit(1);
  }

  // 測試 2: 生成 Buffer
  console.log("📝 測試 2: 生成語音 Buffer...");
  try {
    const audioBuffer = await synthesizeSpeechToBuffer("測試 Buffer 模式");
    if (audioBuffer) {
      console.log(`✅ Buffer 生成成功，大小: ${(audioBuffer.length / 1024).toFixed(2)} KB\n`);
    } else {
      console.error("❌ Buffer 生成失敗\n");
    }
  } catch (error) {
    console.error("❌ Buffer 測試失敗:", error.message);
  }

  console.log("🎉 所有測試完成！");
}

testTTS();

