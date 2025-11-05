# Phase 7: 測試與優化 - 修復記錄

## 問題診斷

應用在 Railway 部署時出現 "Application failed to respond" 錯誤。

### 錯誤 1: SyntaxError - selectVoiceByTags 未導出

**錯誤信息:**
```
SyntaxError: The requested module './tts-cartesia.js' does not provide an export named 'selectVoiceByTags'
```

**位置:** `modules/tts-cartesia-stream.js:8`

**原因:** `selectVoiceByTags` 函數在 `tts-cartesia.js` 中定義但未導出。

**修復:** 在 `modules/tts-cartesia.js` 中將 `selectVoiceByTags` 函數改為 `export function selectVoiceByTags(...)`。

## 修復內容

### 1. 增強錯誤處理

#### 1.1 全局錯誤處理器
- 添加 `uncaughtException` 處理器，捕獲未處理的異常
- 添加 `unhandledRejection` 處理器，捕獲未處理的 Promise 拒絕
- 不退出進程，僅記錄錯誤（Railway 會自動重啟）

```javascript
process.on("uncaughtException", (error) => {
  console.error("❌ 未捕獲的異常:", error);
  console.error("   堆疊:", error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ 未處理的 Promise 拒絕:", reason);
  if (reason && reason.stack) {
    console.error("   堆疊:", reason.stack);
  }
});
```

#### 1.2 express-ws 初始化錯誤處理
- 使用 try-catch 包裹 `expressWs(app)` 調用
- 如果初始化失敗，應用仍可繼續運行（HTTP API 可用）

```javascript
try {
  expressWs(app);
  console.log("✅ express-ws 已啟用");
} catch (error) {
  console.error("❌ express-ws 初始化失敗:", error);
  console.warn("⚠️  WebSocket 功能將不可用");
}
```

#### 1.3 WebSocket 服務器初始化錯誤處理
- 使用 try-catch 包裹 `VoiceWebSocketServer` 初始化
- 如果初始化失敗，應用仍可繼續運行（HTTP API 可用）

```javascript
let wsServer = null;
try {
  wsServer = new VoiceWebSocketServer(app);
  console.log("✅ WebSocket 語音服務器初始化成功");
} catch (wsError) {
  console.error("❌ WebSocket 服務器初始化失敗:", wsError);
  console.warn("⚠️  應用將繼續運行，但 WebSocket 功能不可用");
}
```

#### 1.4 服務器啟動錯誤處理
- 使用 try-catch 包裹 `app.listen()` 調用
- 如果啟動失敗，記錄錯誤並退出進程

```javascript
try {
  app.listen(PORT, () => {
    // ... 啟動成功日誌 ...
  });
} catch (startError) {
  console.error("❌ 服務器啟動失敗:", startError);
  process.exit(1);
}
```

### 2. WebSocket 服務器改進

#### 2.1 構造函數錯誤處理
- 在 `VoiceWebSocketServer` 構造函數中添加 try-catch
- 如果 `setup()` 失敗，記錄錯誤並拋出異常

```javascript
constructor(expressApp) {
  this.app = expressApp;
  this.sessions = new Map();
  
  try {
    this.setup();
  } catch (error) {
    console.error("❌ VoiceWebSocketServer 設置失敗:", error);
    throw error;
  }
}
```

#### 2.2 setup() 方法改進
- 檢查 `app.ws` 是否可用（express-ws 已正確初始化）
- 如果不可用，記錄錯誤並返回，不拋出異常

```javascript
setup() {
  if (typeof this.app.ws !== "function") {
    console.error("❌ app.ws 不可用，WebSocket 端點無法設置");
    return;
  }
  
  try {
    this.app.ws("/api/voice-ws", (ws, req) => {
      this.handleConnection(ws, req);
    });
    console.log("✅ WebSocket 語音端點已設置: /api/voice-ws");
  } catch (error) {
    console.error("❌ 設置 WebSocket 端點失敗:", error);
    throw error;
  }
}
```

### 3. 啟動日誌改進

- 根據 `wsServer` 狀態顯示不同的日誌
- 如果 WebSocket 不可用，明確提示用戶使用 HTTP API

```javascript
if (wsServer) {
  console.log(`   🔌 WebSocket 語音: ws://localhost:${PORT}/api/voice-ws (實時串流) 🆕`);
} else {
  console.log(`   ⚠️  WebSocket 語音: 不可用（使用 HTTP API）`);
}
```

## 測試腳本

### 1. test-websocket-integration.js
- 測試完整的 WebSocket 連接和消息流程
- 驗證服務器響應正確

### 2. test-server-startup.js
- 測試服務器啟動流程
- 驗證健康檢查端點

## 驗證步驟

1. **語法檢查**
   ```bash
   node -c server.js
   node -c modules/websocket-voice.js
   ```

2. **本地啟動測試**
   ```bash
   npm start
   ```

3. **檢查日誌**
   - 確認 express-ws 已啟用
   - 確認 WebSocket 服務器初始化成功
   - 確認服務器正常啟動

4. **部署測試**
   - 推送到 Railway
   - 檢查部署日誌
   - 驗證應用正常響應

## 預期結果

- ✅ 服務器能夠正常啟動
- ✅ 即使 WebSocket 初始化失敗，HTTP API 仍可用
- ✅ 錯誤被正確記錄，不會導致進程崩潰
- ✅ Railway 部署能夠成功

## 後續優化建議

1. **添加健康檢查端點**
   - `/health` 端點返回服務器狀態
   - 包含 WebSocket 狀態信息

2. **性能監控**
   - 監控 WebSocket 連接數
   - 監控內存使用情況
   - 監控 API 響應時間

3. **自動重試機制**
   - 對於暫時性錯誤，添加重試邏輯
   - 對於 WebSocket 連接失敗，自動重連

4. **單元測試**
   - 為各個模組添加單元測試
   - 為 WebSocket 消息處理添加測試

5. **集成測試**
   - 端到端測試完整的語音對話流程
   - 測試錯誤恢復機制

