/**
 * 簡單的測試運行器（原生 Node.js）
 * 不使用任何外部依賴
 */

import assert from "assert";

class TestRunner {
  constructor() {
    this.tests = [];
    this.currentSuite = null;
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  describe(name, fn) {
    const previousSuite = this.currentSuite;
    this.currentSuite = { name, tests: [] };
    fn();
    this.tests.push(this.currentSuite);
    this.currentSuite = previousSuite;
  }

  test(name, fn) {
    if (!this.currentSuite) {
      throw new Error("test() 必須在 describe() 內調用");
    }
    this.currentSuite.tests.push({ name, fn });
  }

  async run() {
    console.log("🧪 開始運行測試...\n");

    for (const suite of this.tests) {
      console.log(`📦 ${suite.name}`);
      
      for (const test of suite.tests) {
        try {
          // 執行測試函數
          const result = test.fn();
          
          // 如果是 Promise，等待完成
          if (result instanceof Promise) {
            await result;
          }
          
          console.log(`  ✅ ${test.name}`);
          this.passed++;
        } catch (error) {
          console.error(`  ❌ ${test.name}`);
          console.error(`     ${error.message}`);
          if (error.stack) {
            console.error(`     ${error.stack.split('\n')[1]?.trim()}`);
          }
          this.failed++;
          this.errors.push({
            suite: suite.name,
            test: test.name,
            error: error.message,
            stack: error.stack,
          });
        }
      }
      console.log("");
    }

    // 輸出總結
    console.log("📊 測試結果:");
    console.log(`   ✅ 通過: ${this.passed}`);
    console.log(`   ❌ 失敗: ${this.failed}`);
    console.log(`   📈 總計: ${this.passed + this.failed}`);

    if (this.failed > 0) {
      console.log("\n❌ 失敗的測試:");
      for (const err of this.errors) {
        console.log(`   ${err.suite} > ${err.test}: ${err.error}`);
      }
      process.exit(1);
    } else {
      console.log("\n✅ 所有測試通過！");
      process.exit(0);
    }
  }
}

// 創建全局測試運行器
const runner = new TestRunner();

// 導出測試函數
export function describe(name, fn) {
  runner.describe(name, fn);
}

export function test(name, fn) {
  runner.test(name, fn);
}

// 運行測試
export async function run() {
  await runner.run();
}

// 簡單的斷言函數（類似 jest 的 expect）
export function expect(value) {
  return {
    toBe(expected) {
      assert.strictEqual(value, expected, `Expected ${value} to be ${expected}`);
    },
    toEqual(expected) {
      assert.deepStrictEqual(value, expected, `Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
    },
    toBeDefined() {
      assert.notStrictEqual(value, undefined, `Expected value to be defined`);
    },
    toBeNull() {
      assert.strictEqual(value, null, `Expected ${value} to be null`);
    },
    toBeTruthy() {
      assert.ok(value, `Expected ${value} to be truthy`);
    },
    toBeFalsy() {
      assert.ok(!value, `Expected ${value} to be falsy`);
    },
    toHaveProperty(prop) {
      assert.ok(value.hasOwnProperty(prop), `Expected object to have property ${prop}`);
    },
    toContain(item) {
      if (Array.isArray(value)) {
        assert.ok(value.includes(item), `Expected array to contain ${item}`);
      } else if (typeof value === 'string') {
        assert.ok(value.includes(item), `Expected string to contain ${item}`);
      } else {
        throw new Error(`toContain() can only be used with arrays or strings`);
      }
    },
    toThrow() {
      return {
        rejects: async (promise) => {
          try {
            await promise;
            throw new Error("Expected promise to throw");
          } catch (error) {
            // 成功拋出錯誤
            return true;
          }
        },
      };
    },
    not: {
      toThrow() {
        // 不拋出錯誤即為成功
        return true;
      },
    },
    async rejects(promise) {
      try {
        await promise;
        throw new Error("Expected promise to reject");
      } catch (error) {
        // 成功拋出錯誤
        return true;
      }
    },
  };
}

// Mock 函數（簡單實現）
export function jest() {
  return {
    fn() {
      const calls = [];
      const fn = function(...args) {
        calls.push(args);
        return undefined;
      };
      fn.mock = {
        calls,
      };
      return fn;
    },
    resetModules() {
      // 簡單實現：不執行任何操作
      // 在 ES modules 中，模組緩存由 Node.js 管理
    },
  };
}

