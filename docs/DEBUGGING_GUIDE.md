# 🐛 調試指南：如何查看錯誤

當遇到 "undefined" 或其他錯誤時，可以通過以下方式查看問題：

---

## 📋 方法 1：瀏覽器控制台（最常用）

### 步驟：
1. **打開開發者工具**
   - Windows/Linux: 按 `F12` 或 `Ctrl+Shift+I`
   - Mac: 按 `Cmd+Option+I`
   - 或右鍵點擊頁面 → 選擇「檢查」或「Inspect」

2. **切換到「主控台」標籤（Console）**
   - 這裡會顯示所有 JavaScript 錯誤和日誌

3. **查看錯誤信息**
   - 紅色錯誤：`❌` 或 `Error: ...`
   - 黃色警告：`⚠️` 或 `Warning: ...`
   - 藍色日誌：`📥` 或 `📤` 等調試信息

### 常見錯誤類型：
- `TypeError: Cannot read property 'fullText' of undefined` - 數據未定義
- `WebSocket connection failed` - WebSocket 連接失敗
- `Network request failed` - 網絡請求失敗

---

## 🌐 方法 2：網絡請求（Network Tab）

### 步驟：
1. 打開開發者工具
2. 切換到「網路」標籤（Network）
3. 刷新頁面或重新發送消息
4. 查看請求：
   - `/api/chat` - 文字聊天
   - `/api/voice-chat` - 語音聊天
   - `/api/voice-ws` - WebSocket 連接（如果可見）

### 檢查點：
- **狀態碼**：200 = 成功，500 = 服務器錯誤，404 = 找不到
- **響應內容**：點擊請求查看返回的 JSON 數據
- **請求頭**：檢查是否包含必要的認證信息

---

## 🔍 方法 3：WebSocket 消息監控

### 步驟：
1. 打開控制台
2. 查找以下日誌：
   ```
   📥 收到 WebSocket 消息: llm_stream_end {type: "llm_stream_end", data: {...}}
   ```
3. 檢查 `data.fullText` 是否存在：
   - 如果 `data.fullText` 是 `undefined`，說明後端沒有正確發送
   - 如果 `data.fullText` 是空字符串，說明 LLM 沒有生成內容

---

## 🖥️ 方法 4：服務器日誌（Railway）

### 步驟：
1. 登入 Railway Dashboard
2. 選擇你的項目
3. 點擊「Deployments」→ 選擇最新的部署
4. 點擊「View Logs」
5. 查看錯誤日誌：
   - `❌` 標記的錯誤
   - `⚠️` 標記的警告
   - 堆疊追蹤（Stack Trace）

### 關鍵日誌：
- `🎭 語音轉譯完成` - 轉譯層工作正常
- `✅ LLM 流式處理完成` - LLM 處理完成
- `✅ TTS 流式處理完成` - TTS 處理完成
- `❌ LLM 流式處理失敗` - LLM 錯誤
- `❌ TTS 流式處理失敗` - TTS 錯誤

---

## 🔧 方法 5：前端代碼檢查

### 在控制台執行以下命令：

```javascript
// 檢查 WebSocket 連接狀態
console.log('WebSocket 狀態:', wsConnection?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

// 檢查當前流式消息
console.log('當前流式消息:', currentStreamingMessage);

// 檢查對話歷史
console.log('對話歷史:', conversationHistory);

// 檢查消息歷史
console.log('消息歷史:', messageHistory);
```

---

## 🎯 常見問題診斷

### 問題 1：顯示 "undefined"
**可能原因：**
- `msg.data.fullText` 是 `undefined`
- 後端沒有正確發送 `fullText` 字段

**檢查方法：**
```javascript
// 在控制台查看 WebSocket 消息
// 應該看到完整的消息對象，檢查 data.fullText 是否存在
```

**解決方案：**
- 檢查後端 `websocket-voice.js` 中的 `llm_stream_end` 消息發送邏輯
- 確保 `finalReply` 不是 `undefined`

### 問題 2：三個跳跳球一直跳（無回應）
**可能原因：**
- LLM 流式處理超時
- TTS 處理失敗
- WebSocket 連接中斷

**檢查方法：**
- 查看控制台是否有 `⚠️ LLM 流式處理超時` 日誌
- 查看 Network 標籤是否有失敗的請求

**解決方案：**
- 前端已有 30 秒超時機制，會自動清除動畫
- 檢查後端日誌，確認 LLM 或 TTS 是否正常完成

### 問題 3：語音無法播放
**可能原因：**
- TTS 生成失敗
- 音頻數據格式錯誤
- 瀏覽器自動播放被阻止

**檢查方法：**
- 查看控制台是否有 `❌ TTS 流式處理失敗` 日誌
- 檢查 Network 標籤中 `/api/speak` 請求的響應

---

## 📝 調試技巧

1. **啟用詳細日誌**：在控制台輸入：
   ```javascript
   localStorage.setItem('debug', 'true');
   location.reload();
   ```

2. **清除緩存**：按 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac) 強制刷新

3. **禁用緩存**：在 Network 標籤勾選「Disable cache」

4. **檢查本地存儲**：在控制台輸入：
   ```javascript
   console.log('對話歷史:', localStorage.getItem('lingya_conversation_history'));
   ```

---

## 🆘 如果仍然無法解決

請提供以下信息：
1. 瀏覽器控制台的完整錯誤信息（截圖）
2. Network 標籤中失敗請求的詳細信息
3. Railway 服務器日誌（最近的錯誤）
4. 具體的操作步驟（如何觸發錯誤）

---

**最後更新：** 2025-11-05


