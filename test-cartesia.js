/**
 * 快速測試 Cartesia TTS 語音合成
 * 驗證花小軟 Cartesia 聲線是否正常運作
 */

import dotenv from "dotenv";
import { synthesizeSpeechCartesia, synthesizeSpeechCartesiaToBuffer } from "./modules/tts-cartesia.js";
import fs from "fs";

dotenv.config();

async function testCartesia() {
  console.log("🧪 測試 Cartesia TTS 語音合成...\n");

  // 檢查環境變數
  if (!process.env.CARTESIA_API_KEY) {
    console.error("❌ 請在 .env 文件中設定 CARTESIA_API_KEY");
    process.exit(1);
  }

  if (!process.env.CARTESIA_VOICE_ID) {
    console.error("❌ 請在 .env 文件中設定 CARTESIA_VOICE_ID");
    process.exit(1);
  }

  console.log("✅ Cartesia API Key 已設定");
  console.log(`📦 使用模型: ${process.env.CARTESIA_TTS_MODEL_ID || "sonic-3"}`);
  console.log(`🎤 使用音色 ID: ${process.env.CARTESIA_VOICE_ID}`);
  console.log(`🌐 語言: ${process.env.CARTESIA_LANGUAGE || "zh"}`);
  console.log(`🔊 採樣率: ${process.env.CARTESIA_SAMPLE_RATE || "44100"} Hz\n`);

  // 測試文字
  const testText = "你好，我是花小軟，用Cartesia聲音和你說話。很高興認識你！";

  // 測試 1: 生成檔案
  console.log("📝 測試 1: 生成語音檔案...");
  console.log(`   輸入文字: "${testText}"`);

  try {
    const startTime = Date.now();
    const filePath = await synthesizeSpeechCartesia(testText, "outputs/test-cartesia.wav");
    const duration = Date.now() - startTime;

    if (filePath && fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`\n✅ 測試成功！`);
      console.log(`   📁 檔案路徑: ${filePath}`);
      console.log(`   📊 檔案大小: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   ⏱️  生成時間: ${duration}ms`);
      console.log(`\n💡 提示: 可以用媒體播放器打開 ${filePath} 收聽 Cartesia 語音\n`);
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
    const audioBuffer = await synthesizeSpeechCartesiaToBuffer("測試 Cartesia Buffer 模式");
    if (audioBuffer) {
      console.log(`✅ Buffer 生成成功，大小: ${(audioBuffer.length / 1024).toFixed(2)} KB\n`);
    } else {
      console.error("❌ Buffer 生成失敗\n");
    }
  } catch (error) {
    console.error("❌ Buffer 測試失敗:", error.message);
  }

  console.log("🎉 所有測試完成！花小軟 Cartesia 聲線已覺醒！🎙️");
}

testCartesia();

