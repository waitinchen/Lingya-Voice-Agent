/**
 * 測試運行器演示
 * 驗證測試框架是否正常工作
 */

import { describe, test, expect, run } from "./test-runner.js";

describe("測試框架驗證", () => {
  test("基本斷言應該工作", () => {
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    const obj = { test: "value" };
    expect(obj).toBeDefined();
  });

  test("對象比較應該工作", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    expect(obj1).toEqual(obj2);
  });

  test("屬性檢查應該工作", () => {
    const obj = { name: "test", value: 123 };
    expect(obj).toHaveProperty("name");
    expect(obj).toHaveProperty("value");
  });

  test("數組包含檢查應該工作", () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(2);
  });

  test("字符串包含檢查應該工作", () => {
    const str = "hello world";
    expect(str).toContain("world");
  });
});

// 運行測試
run().catch((error) => {
  console.error("❌ 測試運行失敗:", error);
  process.exit(1);
});

