# 🔍 黃蓉語音助手 - 檢查與除錯需求表

## 📋 檢查清單

### 1. 環境配置檢查

#### 1.1 環境變數檢查
- [ ] 檢查 `.env` 文件是否存在
- [ ] 確認以下環境變數已設置：
  - `ANTHROPIC_API_KEY` - Claude API 密鑰
  - `OPENAI_API_KEY` - OpenAI API 密鑰（用於 Whisper STT）
  - `CARTESIA_API_KEY` - Cartesia TTS API 密鑰
  - `CARTESIA_VOICE_ID` - Cartesia 語音 ID（可選）
  - `LLM_PROVIDER` - LLM 提供商（"claude" 或 "openai"）
  - `CLAUDE_MODEL` - Claude 模型名稱（默認：claude-3-5-sonnet-20241022）

#### 1.2 依賴檢查
```bash
# 檢查 package.json 中的依賴是否已安裝
npm list @anthropic-ai/sdk
npm list openai
npm list @cartesia/cartesia-js
npm list express
npm list express-ws
```

### 2. 代碼問題檢查

#### 2.1 WebSocket 連接問題
**檢查點：**
- [ ] `server.js` 中 `express-ws` 是否正確初始化
- [ ] WebSocket 端點 `/api/voice-ws` 是否正確設置
- [ ] 前端 WebSocket 連接 URL 是否正確（`wss://` 或 `ws://`）

**調試步驟：**
1. 打開瀏覽器開發者工具（F12）
2. 查看 Console 標籤，檢查是否有 WebSocket 連接錯誤
3. 查看 Network 標籤，檢查 WebSocket 連接狀態
4. 檢查服務器日誌，確認 WebSocket 連接是否建立

**常見錯誤：**
- `WebSocket connection failed` - 檢查服務器是否運行，端口是否正確
- `app.ws is not a function` - 檢查 `express-ws` 是否正確初始化

#### 2.2 LLM 處理問題
**檢查點：**
- [ ] `modules/llm-stream.js` 中 Anthropic SDK 調用是否正確
- [ ] 確認沒有使用 `signal` 參數（Anthropic SDK 不支持）
- [ ] 確認 `abortSignal` 在循環中正確檢查

**調試步驟：**
1. 檢查服務器日誌中的 LLM 處理日誌
2. 確認 API 密鑰是否有效
3. 檢查是否有 API 限流或錯誤

**常見錯誤：**
- `signal: Extra inputs are not permitted` - 已修復，確認代碼已更新
- `Request was aborted` - 檢查中止處理邏輯
- `LLM 回應為空` - 檢查 LLM 處理流程

#### 2.3 消息顯示問題
**檢查點：**
- [ ] `public/index.html` 中消息處理邏輯
- [ ] 確認 `undefined` 消息不會被顯示
- [ ] 確認思考消息不會重複創建

**調試步驟：**
1. 檢查瀏覽器 Console 中的警告和錯誤
2. 檢查 `messageHistory` 中是否有無效消息
3. 檢查 `currentStreamingMessage` 是否正確管理

**常見錯誤：**
- 顯示 "undefined" 消息 - 檢查消息驗證邏輯
- 多個思考動畫同時顯示 - 檢查思考消息清理邏輯
- 消息不更新 - 檢查 WebSocket 消息處理

#### 2.4 音頻處理問題
**檢查點：**
- [ ] TTS 音頻流是否正確接收
- [ ] 音頻播放是否正常
- [ ] 音頻格式是否正確（WAV）

**調試步驟：**
1. 檢查 `tts_stream_chunk` 消息是否正確接收
2. 檢查音頻 Base64 解碼是否正確
3. 檢查瀏覽器音頻播放權限

**常見錯誤：**
- 收不到聲音 - 檢查 TTS 流式處理邏輯
- 音頻播放失敗 - 檢查音頻格式和播放邏輯

### 3. 功能測試檢查

#### 3.1 基本對話測試
- [ ] 發送文字消息，確認能收到回應
- [ ] 確認回應不是 "undefined"
- [ ] 確認思考動畫正常顯示和消失
- [ ] 確認不會出現多個思考動畫

#### 3.2 語音功能測試
- [ ] 測試語音錄音功能
- [ ] 確認語音識別（STT）正常工作
- [ ] 確認語音合成（TTS）正常播放
- [ ] 確認流式音頻播放正常

#### 3.3 錯誤處理測試
- [ ] 測試網絡中斷情況
- [ ] 測試超時處理（60秒）
- [ ] 測試錯誤消息顯示
- [ ] 確認中止錯誤不會顯示給用戶

### 4. 性能檢查

#### 4.1 響應時間檢查
- [ ] LLM 響應時間是否在合理範圍內（< 60秒）
- [ ] STT 處理時間是否正常（< 30秒）
- [ ] TTS 生成時間是否正常（< 45秒）

#### 4.2 資源使用檢查
- [ ] 檢查內存使用是否正常
- [ ] 檢查 WebSocket 連接數是否正常
- [ ] 檢查音頻緩衝區是否正確清理

### 5. 日誌檢查

#### 5.1 服務器日誌
檢查以下日誌：
- [ ] WebSocket 連接日誌
- [ ] LLM 處理日誌
- [ ] STT 處理日誌
- [ ] TTS 處理日誌
- [ ] 錯誤日誌

#### 5.2 瀏覽器日誌
檢查以下日誌：
- [ ] WebSocket 連接狀態
- [ ] 消息接收日誌
- [ ] 錯誤和警告
- [ ] 音頻播放日誌

## 🐛 常見問題排查

### 問題 1: "undefined" 消息顯示

**可能原因：**
- 消息歷史中保存了無效消息
- `llm_stream_chunk` 收到 undefined 的 fullText
- 消息驗證邏輯有問題

**排查步驟：**
1. 檢查 `public/index.html` 中的 `addMessage` 函數
2. 檢查消息歷史恢復邏輯
3. 檢查 `llm_stream_chunk` 處理邏輯
4. 清理 localStorage 中的消息歷史

**修復方法：**
```javascript
// 在 addMessage 中添加驗證
if (!text || text === 'undefined' || text.trim() === '') {
    console.warn('⚠️ addMessage 收到無效的 text 參數:', text);
    return null;
}
```

### 問題 2: 多個思考動畫同時顯示

**可能原因：**
- 快速發送多條消息
- 舊的思考消息沒有被清理
- `currentStreamingMessage` 管理不當

**排查步驟：**
1. 檢查 `llm_stream_start` 處理邏輯
2. 檢查 `sendTextMessage` 中的清理邏輯
3. 檢查思考消息的創建和清理時機

**修復方法：**
```javascript
// 在 llm_stream_start 中清理舊的思考消息
const allThinkingMessages = messagesEl.querySelectorAll('[data-thinking="true"]');
allThinkingMessages.forEach(msg => msg.remove());
```

### 問題 3: "Request was aborted" 錯誤顯示

**可能原因：**
- 中止錯誤沒有被正確處理
- 錯誤消息被發送到前端

**排查步驟：**
1. 檢查 `modules/llm-stream.js` 中的錯誤處理
2. 檢查 `modules/websocket-voice.js` 中的錯誤處理
3. 確認中止錯誤被靜默處理

**修復方法：**
```javascript
// 在錯誤處理中識別中止錯誤
const isAbortError = 
    error.name === "AbortError" || 
    error.message === "LLM stream aborted" ||
    error.message === "Request was aborted";
    
if (isAbortError) {
    // 靜默處理，不發送錯誤消息
    return;
}
```

### 問題 4: 響應超時

**可能原因：**
- LLM 處理時間過長
- 網絡延遲
- API 限流

**排查步驟：**
1. 檢查 LLM API 響應時間
2. 檢查網絡連接
3. 檢查 API 限流狀態
4. 確認超時時間設置（60秒）

**修復方法：**
- 增加超時時間（已設置為 60 秒）
- 優化 LLM 請求參數（減少 max_tokens）
- 添加重試機制

### 問題 5: 收不到聲音

**可能原因：**
- TTS 音頻流沒有正確接收
- 音頻播放邏輯有問題
- 瀏覽器音頻權限問題

**排查步驟：**
1. 檢查 `tts_stream_chunk` 消息是否接收
2. 檢查音頻 Base64 解碼
3. 檢查音頻播放邏輯
4. 檢查瀏覽器音頻權限

**修復方法：**
```javascript
// 確保音頻流正確處理
case 'tts_stream_chunk':
    if (msg.data?.audio) {
        const audioData = atob(msg.data.audio);
        // 處理音頻數據...
    }
```

## 🔧 調試工具和命令

### 本地測試命令

```bash
# 啟動開發服務器
npm start

# 檢查環境變數
node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY ? '✅ ANTHROPIC_API_KEY 已設置' : '❌ ANTHROPIC_API_KEY 未設置')"

# 測試 WebSocket 連接
# 打開瀏覽器控制台，檢查 WebSocket 連接狀態
```

### 瀏覽器調試

1. **打開開發者工具**（F12）
2. **Console 標籤** - 查看日誌和錯誤
3. **Network 標籤** - 查看 WebSocket 連接和請求
4. **Application 標籤** - 查看 localStorage 中的消息歷史

### 服務器調試

```bash
# 查看服務器日誌
# 檢查以下關鍵日誌：
# - WebSocket 連接日誌
# - LLM 處理日誌
# - STT/TTS 處理日誌
# - 錯誤日誌
```

## 📝 測試用例

### 測試用例 1: 基本文字對話
1. 打開頁面
2. 在輸入框輸入 "你好"
3. 點擊發送
4. **預期結果：**
   - 顯示思考動畫
   - 收到 AI 回應（不是 undefined）
   - 思考動畫消失
   - 只有一個思考動畫

### 測試用例 2: 快速發送多條消息
1. 快速連續發送 3 條消息
2. **預期結果：**
   - 舊的思考動畫被清理
   - 只有最新的思考動畫顯示
   - 每條消息都能收到回應

### 測試用例 3: 語音對話
1. 點擊麥克風按鈕
2. 說話（至少 0.5 秒）
3. 停止錄音
4. **預期結果：**
   - 語音被識別為文字
   - 文字顯示在輸入框
   - 收到 AI 回應
   - 播放語音回應

### 測試用例 4: 錯誤處理
1. 斷開網絡連接
2. 發送消息
3. **預期結果：**
   - 顯示適當的錯誤消息
   - 不會顯示 "Request was aborted"
   - 不會顯示 "undefined"

## ✅ 修復驗證清單

修復後，確認以下項目：

- [ ] 不會顯示 "undefined" 消息
- [ ] 不會顯示 "Request was aborted" 錯誤
- [ ] 不會出現多個思考動畫
- [ ] 超時處理正常（60秒）
- [ ] 語音功能正常
- [ ] 錯誤處理正常
- [ ] 消息歷史正確保存和恢復
- [ ] WebSocket 連接穩定
- [ ] LLM 響應正常
- [ ] TTS 音頻播放正常

## 📚 相關文檔

- `docs/BUG_FIX_ABORTSIGNAL.md` - abortSignal 錯誤修復文檔
- `docs/DEBUGGING_GUIDE.md` - 調試指南
- `docs/CODE_STATUS_REPORT.md` - 代碼狀態報告

## 🆘 需要幫助時

如果遇到無法解決的問題：

1. **收集信息：**
   - 瀏覽器 Console 日誌
   - 服務器日誌
   - 錯誤截圖
   - 復現步驟

2. **檢查相關文件：**
   - `modules/llm-stream.js` - LLM 流式處理
   - `modules/websocket-voice.js` - WebSocket 語音服務
   - `public/index.html` - 前端界面
   - `server.js` - 服務器主文件

3. **參考修復記錄：**
   - 查看 Git 提交歷史
   - 查看相關文檔
   - 檢查已知問題列表

---

**最後更新：** 2025-01-XX
**維護者：** CODEX 本地開發團隊

