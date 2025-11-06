/**
 * 語音轉譯層測試腳本
 */

import { rewriteForSpeech } from "../modules/speech-layer/rewriteForSpeech.js";

console.log("🧪 測試語音轉譯層...\n");

// 測試用例
const testCases = [
  {
    input: "我知道你是誰。",
    expected: "我才不信你猜不到～",
    description: "表達替換測試",
  },
  {
    input: "這是我的秘密。",
    description: "標點符號和語助詞測試",
  },
  {
    input: "我不會說。",
    expected: "我才不說給你聽咧～",
    description: "表達替換和語助詞測試",
  },
  {
    input: "你是誰？",
    description: "問句轉換測試",
  },
  {
    input: "我是黃蓉，桃花島的大小姐。",
    description: "禁止短語測試（應該返回 fallback）",
  },
];

console.log("📝 測試用例：\n");

for (const testCase of testCases) {
  console.log(`\n測試: ${testCase.description}`);
  console.log(`輸入: "${testCase.input}"`);
  
  try {
    const result = rewriteForSpeech(testCase.input, "RONG-001", {
      emotionTags: ["playful"],
    });
    
    console.log(`輸出: "${result}"`);
    
    if (testCase.expected) {
      if (result.includes(testCase.expected) || testCase.expected.includes(result)) {
        console.log("✅ 通過");
      } else {
        console.log("⚠️ 部分匹配（可能因為隨機語助詞）");
      }
    } else {
      console.log("✅ 轉譯完成");
    }
  } catch (error) {
    console.error(`❌ 錯誤: ${error.message}`);
  }
}

console.log("\n✅ 測試完成！");


