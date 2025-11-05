# 測試框架文檔

**版本：** v1.0  
**更新時間：** 2025-11-05

---

## 📋 概述

本專案使用**原生 Node.js 測試框架**，不依賴任何外部測試庫（如 Jest、Mocha 等）。

**優勢：**
- ✅ 零依賴，啟動快速
- ✅ 使用 Node.js 內建的 `assert` 模組
- ✅ 語法類似 Jest，學習成本低
- ✅ 完全支持 ES Modules

---

## 🚀 快速開始

### 運行所有單元測試

```bash
npm run test:unit
```

### 運行單個測試文件

```bash
# VoiceSession 測試
npm run test:voice-session

# TTS Stream 測試
npm run test:tts-stream

# 健康檢查端點測試
npm run test:health
```

### 直接運行測試文件

```bash
node test/test-voice-session.js
node test/test-tts-cartesia-stream.js
node test/test-health-endpoint.js
```

---

## 📝 測試框架 API

### `describe(name, fn)`

創建一個測試套件（test suite）。

```javascript
describe("VoiceSession", () => {
  // 測試用例...
});
```

### `test(name, fn)`

創建一個測試用例。

```javascript
test("應該創建會話", () => {
  // 測試邏輯...
});
```

### `expect(value)`

創建斷言對象。

**可用的斷言方法：**

- `toBe(expected)` - 嚴格相等（使用 `===`）
- `toEqual(expected)` - 深度相等（對象/數組比較）
- `toBeDefined()` - 值不是 `undefined`
- `toBeNull()` - 值是 `null`
- `toBeTruthy()` - 值是 truthy
- `toBeFalsy()` - 值是 falsy
- `toHaveProperty(prop)` - 對象有指定屬性
- `toContain(item)` - 數組或字符串包含指定值
- `rejects(promise)` - Promise 應該被拒絕

**示例：**

```javascript
test("基本斷言", () => {
  expect(1 + 1).toBe(2);
  expect({ a: 1 }).toEqual({ a: 1 });
  expect("hello").toContain("ell");
  expect([1, 2, 3]).toContain(2);
});

test("異步測試", async () => {
  const promise = Promise.reject(new Error("test"));
  await expect().rejects(promise);
});
```

---

## 📁 測試文件結構

```
test/
├── test-runner.js              # 測試框架核心
├── test-voice-session.js       # VoiceSession 單元測試
├── test-tts-cartesia-stream.js # TTS Stream 測試
├── test-health-endpoint.js     # 健康檢查端點測試
├── test-websocket.js           # WebSocket 連接測試
├── test-websocket-integration.js # WebSocket 集成測試
└── ...
```

---

## 🧪 編寫測試示例

### 基本測試

```javascript
import { describe, test, expect, run } from "./test-runner.js";
import { VoiceSession, SessionState } from "../modules/voice-session.js";

describe("VoiceSession", () => {
  test("應該創建會話", () => {
    const session = new VoiceSession(mockWs);
    expect(session).toBeDefined();
    expect(session.currentState).toBe(SessionState.IDLE);
  });
});

run().catch((error) => {
  console.error("❌ 測試失敗:", error);
  process.exit(1);
});
```

### 異步測試

```javascript
test("應該處理異步操作", async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Mock 對象

```javascript
class MockWebSocket {
  constructor() {
    this.readyState = 1; // WebSocket.OPEN
    this.sendCalls = [];
    this.send = (data) => {
      this.sendCalls.push(data);
    };
  }
}

test("應該發送消息", () => {
  const mockWs = new MockWebSocket();
  // 使用 mockWs 進行測試...
});
```

---

## 🔍 測試覆蓋範圍

### 當前覆蓋

- ✅ `VoiceSession` - 會話管理功能
- ✅ `TTS Cartesia Stream` - 流式 TTS 處理
- ✅ `/health` 端點 - 健康檢查
- ✅ WebSocket 連接 - 基礎連接測試
- ✅ WebSocket 集成 - 完整流程測試

### 待添加

- [ ] `audio-processor.js` - 音頻處理工具
- [ ] `llm-stream.js` - LLM 流式處理
- [ ] `websocket-voice.js` - WebSocket 服務器核心
- [ ] `prompt-routing.js` - Prompt Routing 系統

---

## 📊 測試結果

運行測試後會顯示：

```
🧪 開始運行測試...

📦 VoiceSession
  ✅ 應該創建會話並初始化為 IDLE 狀態
  ✅ 應該能夠設置狀態
  ...

📊 測試結果:
   ✅ 通過: 10
   ❌ 失敗: 0
   📈 總計: 10

✅ 所有測試通過！
```

---

## 🛠️ 故障排除

### 測試失敗

如果測試失敗，會顯示詳細錯誤信息：

```
❌ 應該創建會話
   Expected undefined to be defined
   at test/test-voice-session.js:34
```

### 服務器未運行

某些測試（如健康檢查）需要服務器運行：

```
⏭️  跳過（服務器未運行）
💡 提示：請先啟動服務器（npm start）
```

### 模組載入失敗

如果模組載入失敗，測試會跳過：

```
⏭️  跳過（模組未載入）
```

---

## 📚 參考資源

- [Node.js assert 模組文檔](https://nodejs.org/api/assert.html)
- [測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**最後更新：** 2025-11-05

