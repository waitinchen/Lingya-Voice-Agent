# 🚀 快速啟動指南

按照步驟逐步驗證系統是否正常運作。

## Step 1: 安裝基礎依賴

```bash
npm install express ws dotenv
```

> ✅ 已確認：`package.json` 中已包含這些依賴

## Step 2: 環境變數設定

`.env` 文件已創建，包含：

```env
PORT=3000
LLM_PROVIDER=ollama
TTS_PROVIDER=coqui
```

## Step 3: 測試伺服器啟動

在終端執行：

```bash
node server.js
```

應該看到：

```
🚀 Server started on port 3000
   Visit: http://localhost:3000
   API: POST http://localhost:3000/api/chat
```

然後在瀏覽器打開 `http://localhost:3000`，應該看到：

```
Lingya Voice Agent is running 💫
```

> ✅ 如果看到這個訊息，代表伺服器成功啟動！

## Step 4: 測試 LLM 模組

### 使用 Postman / Hoppscotch 測試

**請求方式：** POST  
**URL：** `http://localhost:3000/api/chat`  
**Headers：**
```
Content-Type: application/json
```

**Body（JSON）：**
```json
{
  "text": "你好",
  "context": {
    "tone": "自然"
  }
}
```

**預期回應：**
```json
{
  "success": true,
  "text": "你好！我是 Lingya，很高興認識你！",
  "emotion": "平靜",
  "history": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "你好！我是 Lingya，很高興認識你！"
    }
  ]
}
```

### 使用 cURL 測試

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"你好\"}"
```

### 測試不同訊息

試試這些訊息，看看 AI 如何回應：

```json
{"text": "你好嗎"}
```

```json
{"text": "我今天很開心"}
```

```json
{"text": "再見", "context": {"tone": "溫柔"}}
```

## Step 5: 確認里程碑

| 目標          | 驗收方式                                  | 狀態 |
| ----------- | ------------------------------------- | ---- |
| ✅ 伺服器可啟動    | 瀏覽器回應 "Lingya Voice Agent is running" | ⏳   |
| ✅ LLM 可輸出回覆 | `/api/chat` 回傳模擬語氣文字                  | ⏳   |
| ⏳ 下一步       | 串接 Whisper / XTTS 讓 AI「開口說話」          | 🔜   |

## 開發模式（自動重啟）

如果想在修改代碼後自動重啟：

```bash
npm run dev
```

需要先安裝 nodemon（如果還沒安裝）：

```bash
npm install --save-dev nodemon
```

## 疑難排解

### 端口已被占用

如果 `PORT 3000` 已被使用，可以：

1. 修改 `.env` 中的 `PORT=3001`
2. 或關閉占用端口的程序

### 模組找不到

確認所有文件都在正確位置：
- `server.js` 在根目錄
- `modules/llm-simple.js` 存在

### 無法啟動

檢查 Node.js 版本：

```bash
node --version
```

需要 Node.js 18+（支援 ES Modules）

