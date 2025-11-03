/**
 * 快速測試 OpenAI LLM 連接
 * 用於驗證 API Key 是否正確設定
 */

import dotenv from "dotenv";
import { chatWithLLM } from "./modules/llm.js";

dotenv.config();

async function testOpenAI() {
  console.log("🧪 測試 OpenAI LLM 連接...\n");

  // 檢查環境變數
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("xxxxxxx")) {
    console.error("❌ 請在 .env 文件中設定正確的 OPENAI_API_KEY");
    console.log("   格式: OPENAI_API_KEY=sk-your-actual-key-here\n");
    process.exit(1);
  }

  console.log("✅ API Key 已設定");
  console.log(`📦 使用模型: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}\n`);

  // 測試對話
  try {
    console.log("💬 發送測試訊息: '花小軟你好'");
    const reply = await chatWithLLM("花小軟你好");
    console.log(`\n✅ 測試成功！\n📝 花小軟回應:\n   ${reply}\n`);
  } catch (error) {
    console.error("\n❌ 測試失敗:", error.message);
    console.log("\n請檢查：");
    console.log("1. OPENAI_API_KEY 是否正確");
    console.log("2. 網路連接是否正常");
    console.log("3. API 配額是否充足\n");
    process.exit(1);
  }
}

testOpenAI();

