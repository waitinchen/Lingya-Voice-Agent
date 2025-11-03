/**
 * 測試情緒標籤系統
 * 驗證標籤選擇和語音合成功能
 */

import dotenv from "dotenv";
import { chatWithLLM } from "./modules/llm.js";
import { synthesizeSpeechCartesiaToBuffer } from "./modules/tts-cartesia.js";
import { applyEmotion } from "./helpers/emotion.js";
import fs from "fs";

dotenv.config();

async function testEmotionTags() {
  console.log("🧪 測試情緒標籤系統...\n");

  // 測試 1: 測試 applyEmotion 函數
  console.log("📝 測試 1: applyEmotion 函數");
  const testCases = [
    {
      text: "我在這裡呀…別擔心。",
      tags: ["whisper", "breathy", "pause-300"],
    },
    {
      text: "太好了！我好開心！",
      tags: ["excited", "smile"],
    },
    {
      text: "我真的很生氣！",
      tags: ["angry", "louder"],
    },
  ];

  for (const testCase of testCases) {
    const result = applyEmotion(testCase);
    console.log(`\n  文字: "${testCase.text}"`);
    console.log(`  標籤: [${testCase.tags.join(", ")}]`);
    console.log(`  處理後: "${result.script}"`);
    console.log(`  速度: ${result.speed.toFixed(2)}, 音量: ${result.volume.toFixed(2)}`);
    console.log(`  停頓: ${result.pauses.join(", ") || "無"}ms`);
  }

  // 測試 2: LLM 選擇標籤
  console.log("\n\n🤖 測試 2: LLM 主動選擇標籤");
  
  const testPrompts = [
    "小軟，用耳語說給我聽",
    "我今天好開心啊！",
    "我心情不太好...",
  ];

  for (const prompt of testPrompts) {
    console.log(`\n  用戶說: "${prompt}"`);
    const result = await chatWithLLM(prompt, [], {
      enableTags: true,
    });
    console.log(`  花小軟回應: "${result.reply}"`);
    console.log(`  選擇的標籤: [${result.tags.join(", ") || "無"}]`);
  }

  // 測試 3: 語音合成帶標籤
  console.log("\n\n🎙️  測試 3: 語音合成帶標籤");
  
  const ttsTest = {
    text: "我在這裡呀…別擔心。",
    tags: ["whisper", "breathy"],
  };

  console.log(`  文字: "${ttsTest.text}"`);
  console.log(`  標籤: [${ttsTest.tags.join(", ")}]`);
  console.log("  正在生成語音...");

  try {
    const audioBuffer = await synthesizeSpeechCartesiaToBuffer(ttsTest.text, {
      tags: ttsTest.tags,
    });

    if (audioBuffer) {
      const testFile = "outputs/test-tags.wav";
      fs.writeFileSync(testFile, audioBuffer);
      console.log(`✅ 語音生成成功，大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`  檔案: ${testFile}`);
    }
  } catch (error) {
    console.error("❌ 語音生成失敗:", error.message);
  }

  console.log("\n🎉 所有測試完成！");
}

testEmotionTags();

