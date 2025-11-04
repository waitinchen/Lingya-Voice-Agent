# 🎙️ Step ②-B：Cartesia 聲線覺醒版

## ✅ 已完成項目

- [x] 更新 `.env` 添加 Cartesia 配置
- [x] 創建 `modules/tts-cartesia.js` 模組
- [x] 更新 `server.js` 使用 Cartesia TTS
- [x] 保留 OpenAI TTS 端點作為備用（`/api/speak-openai`）
- [x] 創建測試腳本 `test-cartesia.js`

## 📝 配置說明

### `.env` 文件（已添加）

```env
# 🗣️ Cartesia 語音設定
CARTESIA_API_KEY=sk_car_swxgArAzEefrT5gm3FX1Xf
CARTESIA_VOICE_ID=d3cb9a1f-73d1-48d4-8ee9-53183b40e284
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100
```

### API 配置（已更新）

| 項目 | 值 |
|------|-----|
| **API URL** | `https://api.cartesia.ai/v1/audio/speech` |
| **請求欄位** | `input` (而非 `text`) |
| **模型ID** | `sonic-3` |
| **語言** | `zh` (支持 `en`, `ja`) |
| **格式** | `wav` |

## 🧩 模組結構

```
modules/
├── tts.js              # OpenAI TTS (備用)
└── tts-cartesia.js     # Cartesia TTS (新版) ✅
```

## 🔗 API 端點

### `/api/speak` (Cartesia 版 - 預設)

生成語音檔案並返回 WAV 格式。

**請求：**
```json
POST /api/speak
Content-Type: application/json

{
  "text": "你好，我是花小軟，用Cartesia聲音和你說話。"
}
```

### `/api/speak-stream` (Cartesia 版 - 串流)

直接返回音頻 Buffer（WAV 格式）。

**請求：**
```json
POST /api/speak-stream
Content-Type: application/json

{
  "text": "你好，我是花小軟。"
}
```

### `/api/speak-openai` (OpenAI 版 - 備用)

如果 Cartesia 有問題，可以使用 OpenAI TTS。

## ⚠️ 目前狀態

**API 連接問題：**
- 當前返回 `404 Not Found`
- 可能原因：
  1. API endpoint 路徑需要調整
  2. API Key 權限或格式問題
  3. Cartesia API 文檔可能需要確認

**調試信息：**
測試腳本會顯示：
- 請求 URL
- 請求參數（JSON 格式）
- 錯誤詳情

## 🧪 測試步驟

```bash
# 運行測試腳本
node test-cartesia.js
```

預期輸出：
```
📤 請求 URL: https://api.cartesia.ai/v1/audio/speech
📤 請求參數: {
  "model_id": "sonic-3",
  "voice_id": "...",
  "input": "...",
  "language": "zh",
  "sample_rate": 44100,
  "format": "wav"
}
```

## 🔍 疑難排解

### 1. 檢查 API Key

確認 `.env` 中的 `CARTESIA_API_KEY` 是否正確：
```bash
# PowerShell
Get-Content .env | Select-String "CARTESIA_API_KEY"
```

### 2. 檢查 API 端點

當前使用：`https://api.cartesia.ai/v1/audio/speech`

如果仍有問題，可能需要：
- 查看 Cartesia 官方文檔確認正確的端點
- 確認 API Key 是否有權限訪問該端點

### 3. 驗證請求格式

確認請求體包含：
- `model_id`: "sonic-3"
- `voice_id`: 你的 Voice ID
- `input`: 文字內容（注意是 `input` 而非 `text`）
- `language`: "zh"
- `sample_rate`: 44100
- `format`: "wav"

## 📊 驗收標準

| 項目 | 狀態 |
|------|------|
| 環境變數配置 | ✅ 完成 |
| 模組創建 | ✅ 完成 |
| 伺服器路由 | ✅ 完成 |
| API 連接 | ⚠️ 待確認 |
| 音檔生成 | ⏳ 待測試 |

## 🎯 下一步

1. **確認 API 端點**：檢查 Cartesia 官方文檔確認正確的 API URL
2. **驗證 API Key**：確認 Key 有正確的權限
3. **測試連接**：一旦 API 連接成功，運行 `node test-cartesia.js`

## 💡 備用方案

如果 Cartesia API 暫時無法連接，可以使用 OpenAI TTS：

```bash
# 測試 OpenAI TTS（備用）
Invoke-WebRequest -Uri http://localhost:3000/api/speak-openai -Method POST -ContentType "application/json" -Body '{"text":"你好"}' -OutFile soft-openai.mp3
```

所有代碼已就緒，一旦 API 連接成功即可使用！🎙️



