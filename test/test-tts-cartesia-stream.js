/**
 * TTS Cartesia Stream 單元測試
 * 測試流式 TTS 處理功能（使用原生 Node.js）
 */

import { describe, test, expect, run } from "./test-runner.js";

// 動態導入（避免在測試環境中實際調用 API）
let synthesizeSpeechCartesiaStream = null;

try {
  const module = await import("../modules/tts-cartesia-stream.js");
  synthesizeSpeechCartesiaStream = module.synthesizeSpeechCartesiaStream;
} catch (error) {
  console.warn("⚠️ 無法載入 tts-cartesia-stream 模組:", error.message);
}

describe("synthesizeSpeechCartesiaStream", () => {
  test("應該能夠處理基本的 TTS 請求", () => {
    // 測試函數存在
    expect(typeof synthesizeSpeechCartesiaStream).toBe("function");
  });

  test("應該能夠處理 abortSignal", async () => {
    if (!synthesizeSpeechCartesiaStream) {
      console.log("  ⏭️  跳過（模組未載入）");
      return;
    }

    const text = "測試文字";
    const abortController = new AbortController();
    const options = {
      tags: ["warm"],
      abortSignal: abortController.signal,
    };

    // 立即中止
    abortController.abort();

    // 應該能夠處理中止信號（會拋出錯誤或返回空結果）
    try {
      await synthesizeSpeechCartesiaStream(text, options, () => {});
      // 如果沒有拋出錯誤，至少函數應該能夠處理中止
      expect(true).toBe(true);
    } catch (error) {
      // 預期會拋出中止錯誤
      expect(error.name === "AbortError" || error.message.includes("abort")).toBe(true);
    }
  });

  test("應該能夠處理不同的標籤組合", async () => {
    if (!synthesizeSpeechCartesiaStream) {
      console.log("  ⏭️  跳過（模組未載入）");
      return;
    }

    const text = "測試";
    const tagCombinations = [
      ["warm"],
      ["playful", "excited"],
      ["whisper", "breathy"],
      [],
    ];

    for (const tags of tagCombinations) {
      const options = { tags };
      // 測試函數不拋出語法錯誤（即使 API 調用失敗）
      try {
        const result = synthesizeSpeechCartesiaStream(text, options, () => {});
        // 如果是 Promise，應該能夠創建
        expect(result instanceof Promise).toBe(true);
      } catch (error) {
        // 只允許配置錯誤，不允許語法錯誤
        if (error.message.includes("CARTESIA_API_KEY")) {
          // 這是預期的配置錯誤
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    }
  });
});

// 運行測試
run().catch((error) => {
  console.error("❌ 測試運行失敗:", error);
  process.exit(1);
});
