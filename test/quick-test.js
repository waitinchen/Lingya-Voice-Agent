/**
 * 快速測試腳本
 * 測試幾個核心功能是否正常
 */

import dotenv from "dotenv";
import { chatWithLLM, analyzeEmotion } from "../modules/llm.js";

dotenv.config();

console.log("🧪 快速測試花小軟核心功能...\n");

// 測試用例
const quickTests = [
  {
    name: "情緒識別 - 開心",
    input: "我今天好開心！",
    check: async (result, emotion) => {
      return emotion === "開心";
    },
  },
  {
    name: "情緒識別 - 難過",
    input: "我今天心情不太好...",
    check: async (result, emotion) => {
      return emotion === "難過";
    },
  },
  {
    name: "歸屬記憶 - 老爸身份",
    input: "老爸，我來了",
    options: { userIdentity: "dad", userName: "陳威廷" },
    check: async (result) => {
      return result.tags.includes("flirty") || result.tags.includes("breathy");
    },
  },
  {
    name: "標籤選擇 - 主動選擇",
    input: "我今天好開心！",
    check: async (result) => {
      return result.tags.length > 0;
    },
  },
  {
    name: "回應生成",
    input: "你好",
    check: async (result) => {
      return result.reply && result.reply.length > 0;
    },
  },
];

async function runQuickTest() {
  let passed = 0;
  let failed = 0;

  for (const test of quickTests) {
    try {
      console.log(`📋 ${test.name}...`);
      console.log(`   輸入: "${test.input}"`);

      const emotion = await analyzeEmotion(test.input);
      const result = await chatWithLLM(test.input, [], {
        emotion,
        enableTags: true,
        ...(test.options || {}),
      });

      console.log(`   情緒: ${emotion}`);
      console.log(`   標籤: [${result.tags.join(", ") || "無"}]`);
      console.log(`   回應: "${result.reply.substring(0, 50)}..."`);

      const checkResult = await test.check(result, emotion);
      if (checkResult) {
        console.log(`   ✅ 通過\n`);
        passed++;
      } else {
        console.log(`   ❌ 未通過\n`);
        failed++;
      }

      // 等待避免 API 限流
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ 錯誤: ${error.message}\n`);
      failed++;
    }
  }

  console.log("─".repeat(50));
  console.log(`📊 測試結果: ${passed}/${quickTests.length} 通過`);
  console.log(`   ✅ 通過: ${passed}`);
  console.log(`   ❌ 失敗: ${failed}`);

  if (failed === 0) {
    console.log("\n🎉 所有測試通過！花小軟準備就緒！");
  } else {
    console.log("\n⚠️  部分測試未通過，請檢查配置。");
  }
}

runQuickTest();



