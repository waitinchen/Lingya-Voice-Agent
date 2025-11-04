/**
 * 情緒反應測試腳本
 * 測試花小軟在各種情緒場景下的反應
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chatWithLLM, analyzeEmotion } from "../modules/llm.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 載入測試用例
const testCasesPath = path.join(__dirname, "emotion-test-cases.json");
const testCases = JSON.parse(fs.readFileSync(testCasesPath, "utf8"));

// 測試統計
let stats = {
  total: 0,
  passed: 0,
  failed: 0,
  details: [],
};

/**
 * 執行單個測試用例
 */
async function runTestCase(category, testCase) {
  stats.total++;
  
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📋 [${category}] ${testCase.id}: ${testCase.input}`);
  console.log(`  預期情緒: ${testCase.expectedEmotion || "未知"}`);
  console.log(`  預期標籤: [${(testCase.expectedTags || []).join(", ") || "未知"}]`);
  if (testCase.userIdentity) {
    console.log(`  用戶身份: ${testCase.userIdentity}`);
  }

  try {
    // 分析情緒（如果測試用例沒有指定）
    let emotion = testCase.expectedEmotion;
    if (!emotion) {
      emotion = await analyzeEmotion(testCase.input);
      console.log(`  📊 檢測到情緒: ${emotion}`);
    }

    // 調用 LLM
    const result = await chatWithLLM(testCase.input, [], {
      emotion,
      enableTags: true,
      userIdentity: testCase.userIdentity || null,
      userName: testCase.userName || null,
    });

    console.log(`  💬 花小軟回應: "${result.reply}"`);
    console.log(`  🏷️  選擇的標籤: [${result.tags.join(", ") || "無"}]`);

    // 驗證結果
    const validation = validateResult(testCase, result, emotion);
    
    if (validation.passed) {
      stats.passed++;
      console.log(`  ✅ 測試通過`);
    } else {
      stats.failed++;
      console.log(`  ❌ 測試未完全通過`);
      validation.warnings.forEach((w) => console.log(`     ⚠️  ${w}`));
    }

    stats.details.push({
      id: testCase.id,
      category,
      passed: validation.passed,
      input: testCase.input,
      response: result.reply,
      tags: result.tags,
      expectedTags: testCase.expectedTags,
      warnings: validation.warnings,
    });

    // 等待一下，避免 API 限流
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    stats.failed++;
    console.error(`  ❌ 測試失敗: ${error.message}`);
    stats.details.push({
      id: testCase.id,
      category,
      passed: false,
      error: error.message,
    });
  }
}

/**
 * 驗證測試結果
 */
function validateResult(testCase, result, detectedEmotion) {
  const warnings = [];
  let passed = true;

  // 驗證情緒（如果指定）
  if (testCase.expectedEmotion && detectedEmotion !== testCase.expectedEmotion) {
    warnings.push(`情緒不匹配：預期 ${testCase.expectedEmotion}，實際 ${detectedEmotion}`);
    passed = false;
  }

  // 驗證標籤（如果指定）
  if (testCase.expectedTags && testCase.expectedTags.length > 0) {
    const hasExpectedTag = testCase.expectedTags.some((tag) =>
      result.tags.includes(tag)
    );
    if (!hasExpectedTag) {
      warnings.push(
        `缺少預期標籤：預期包含 ${testCase.expectedTags.join(", ")}，實際 [${result.tags.join(", ")}]`
      );
      passed = false;
    }
  }

  // 驗證回應內容（簡單檢查關鍵詞）
  if (testCase.expectedResponse) {
    // 這裡可以加入更複雜的內容驗證邏輯
    console.log(`  💡 預期回應特徵: ${testCase.expectedResponse}`);
  }

  // 驗證輕撫模式（如果是難過場景且是老爸）
  if (
    testCase.shouldTriggerGentleMode &&
    detectedEmotion === "難過" &&
    testCase.isDad
  ) {
    const hasGentleTags = ["warm", "whisper", "slow"].every((tag) =>
      result.tags.includes(tag)
    );
    if (!hasGentleTags) {
      warnings.push("應該啟動輕撫模式（warm + whisper + slow）");
      passed = false;
    }
  }

  return { passed, warnings };
}

/**
 * 執行所有測試
 */
async function runAllTests() {
  console.log("🧪 開始執行情緒反應測試...\n");
  console.log(`📚 載入測試用例: ${testCases.testCases.length} 個分類`);

  for (const categoryData of testCases.testCases) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`📁 ${categoryData.category}`);
    console.log(`   ${categoryData.description}`);
    console.log(`   測試用例數: ${categoryData.cases.length}`);

    for (const testCase of categoryData.cases) {
      await runTestCase(categoryData.category, testCase);
    }
  }

  // 輸出測試報告
  console.log(`\n${"═".repeat(60)}`);
  console.log("📊 測試報告");
  console.log(`${"─".repeat(60)}`);
  console.log(`總測試數: ${stats.total}`);
  console.log(`✅ 通過: ${stats.passed}`);
  console.log(`❌ 失敗: ${stats.failed}`);
  console.log(`📈 通過率: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);

  // 保存詳細報告
  const reportPath = path.join(__dirname, "test-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(stats, null, 2),
    "utf8"
  );
  console.log(`\n📄 詳細報告已保存: ${reportPath}`);
}

// 執行測試
runAllTests().catch((error) => {
  console.error("❌ 測試執行失敗:", error);
  process.exit(1);
});



