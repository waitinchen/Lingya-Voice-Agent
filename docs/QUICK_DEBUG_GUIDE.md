# 🚀 快速除錯指南 - 給本地 CODEX

## ⚠️ 重要：確認項目路徑

**本指南僅適用於 `Lingya_Voice_Agent` 項目！**

**如果目前在 `soft-voice-mvp` 項目中，請先切換：**
```bash
cd /path/to/Lingya_Voice_Agent
# 或查看 CODEX_README.md 獲取詳細切換指南
```

**快速確認：**
```bash
cat package.json | grep "lingya-voice-agent"
# 應該看到項目名稱
ls docs/ modules/
# 應該看到這些目錄存在
```

## ⚡ 快速檢查（5分鐘）

### 1. 環境檢查
```bash
# 檢查環境變數
cat .env | grep -E "ANTHROPIC_API_KEY|OPENAI_API_KEY|CARTESIA_API_KEY"

# 檢查依賴
npm list @anthropic-ai/sdk openai @cartesia/cartesia-js
```

### 2. 啟動服務器
```bash
npm start
# 應該看到：✅ WebSocket 語音端點已設置: /api/voice-ws
```

### 3. 瀏覽器測試
1. 打開 `http://localhost:3000`
2. 打開開發者工具（F12）
3. 發送測試消息 "你好"
4. 檢查 Console 是否有錯誤

## 🔍 常見問題快速修復

### ❌ 問題：顯示 "undefined" 消息
**修復：**
```javascript
// 在 public/index.html 的 addMessage 函數中
if (!text || text === 'undefined' || text.trim() === '') {
    return null; // 不添加無效消息
}
```

### ❌ 問題：多個思考動畫
**修復：**
```javascript
// 在 llm_stream_start 處理中
const allThinkingMessages = messagesEl.querySelectorAll('[data-thinking="true"]');
allThinkingMessages.forEach(msg => msg.remove());
```

### ❌ 問題："Request was aborted" 錯誤
**修復：**
```javascript
// 在錯誤處理中
const isAbortError = error.message === "Request was aborted";
if (isAbortError) {
    return; // 靜默處理
}
```

### ❌ 問題：收不到聲音
**檢查：**
1. 確認 `tts_stream_chunk` 消息是否接收
2. 檢查音頻 Base64 解碼
3. 檢查瀏覽器音頻權限

## 📋 檢查清單

- [ ] 環境變數已設置
- [ ] 服務器正常啟動
- [ ] WebSocket 連接成功
- [ ] 發送消息能收到回應
- [ ] 不會顯示 "undefined"
- [ ] 不會顯示 "Request was aborted"
- [ ] 只有一個思考動畫
- [ ] 語音功能正常

## 🐛 調試命令

```bash
# 查看服務器日誌
npm start | grep -E "WebSocket|LLM|TTS|錯誤"

# 清理消息歷史（瀏覽器 Console）
localStorage.clear()
location.reload()
```

## 📞 需要幫助？

查看完整文檔：`docs/DEBUG_CHECKLIST.md`

