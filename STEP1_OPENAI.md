# 🚀 Step ①：接入 OpenAI LLM 模組

## ✅ 已完成項目

- [x] 安裝 `openai` 依賴包
- [x] 更新 `.env` 添加 `OPENAI_API_KEY` 和 `OPENAI_MODEL`
- [x] 創建 `modules/llm.js` 模組（替換 `llm-simple.js`）
- [x] 更新 `server.js` 使用新的 OpenAI LLM

## 📝 配置說明

### `.env` 文件

```env
PORT=3000
LLM_PROVIDER=ollama
TTS_PROVIDER=coqui
OPENAI_API_KEY=sk-xxxxxxx_your_key_here
OPENAI_MODEL=gpt-4o-mini
```

> ⚠️ **重要**：請將 `OPENAI_API_KEY` 替換為你的實際 API Key  
> `.env` 文件已在 `.gitignore` 中，不會被 commit 到 GitHub

### 模組結構

- `modules/llm.js` - OpenAI LLM 對話模組
  - `chatWithLLM(prompt)` - 與 GPT-4 對話

## 🧪 測試流程

### 1. 啟動伺服器

```bash
node server.js
```

應該看到：

```
🚀 Server started on port 3000
   Visit: http://localhost:3000
   API: POST http://localhost:3000/api/chat
```

### 2. 測試 API（PowerShell）

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/chat -Method POST -ContentType "application/json" -Body '{"text":"花小軟你好"}'
```

### 3. 預期回應

```json
{
  "reply": "嗨嗨～我是花小軟！你今天過得好嗎？💖"
}
```

## 📊 模型配置

| 項目 | 值 | 說明 |
|------|-----|------|
| **預設模型** | `gpt-4o-mini` | 低延遲、自然語氣，適合 MVP |
| **溫度參數** | `0.8` | 平衡創造力與一致性 |
| **最大 Token** | `200` | 簡短回應，適合語音輸出 |
| **系統提示** | 花小軟角色設定 | 自然、溫柔、可愛的語氣 |

## 🔒 安全性

- ✅ `.env` 已在 `.gitignore` 中
- ✅ API Key 不會出現在代碼中
- ✅ 錯誤處理已實作（API 失敗時返回友好訊息）

## 🐛 常見問題

### OpenAI API 錯誤

**問題**：`401 Unauthorized`  
**解決**：檢查 `.env` 中的 `OPENAI_API_KEY` 是否正確

**問題**：`429 Rate Limit`  
**解決**：稍候再試，或檢查 API 配額

**問題**：`Model not found`  
**解決**：確認 `OPENAI_MODEL` 是否為有效的模型名稱（如 `gpt-4o-mini`、`gpt-4o`）

### 伺服器無法啟動

檢查：
1. `.env` 文件是否存在
2. `OPENAI_API_KEY` 是否已設定
3. Node.js 版本是否為 18+

## 📈 下一步

完成 Step ① 後，可進行：

- **Step ②**：加語音輸出模組 `modules/tts.js`
  - 讓花小軟「開口講話」
  - 整合 XTTS 或 Coqui TTS

## 💡 最佳實踐

1. **模型選擇**：MVP 使用 `gpt-4o-mini`，正式版可升級至 `gpt-4o`
2. **錯誤處理**：已實作 `try...catch`，API 失敗時返回友好訊息
3. **模組化設計**：`modules/llm.js` 可獨立替換為其他 LLM Provider
4. **後續擴展**：可接入 EmotionTags 中介層進行語氣強化

