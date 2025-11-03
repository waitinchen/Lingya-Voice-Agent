# 🔊 Step ②：語音輸出模組 TTS

## ✅ 已完成項目

- [x] 安裝 `node-fetch` 依賴（雖然實際使用 OpenAI SDK，但已安裝以備用）
- [x] 更新 `.env` 添加 `TTS_MODEL` 和 `TTS_VOICE` 配置
- [x] 創建 `modules/tts.js` 模組
- [x] 在 `server.js` 新增 `/api/speak` 和 `/api/speak-stream` 端點
- [x] 錯誤處理已實作
- [x] `outputs/` 目錄已加入 `.gitignore`

## 📝 配置說明

### `.env` 文件

```env
TTS_MODEL=tts-1
TTS_VOICE=alloy
```

**TTS 模型說明：**
- `tts-1`: OpenAI 標準 TTS 模型（推薦）
- `tts-1-hd`: 高品質版本（需要更多配額）

**可選音色：**
- `alloy`: 自然中性（推薦作為花小軟初始音色）
- `echo`: 清晰明亮
- `fable`: 溫暖柔和
- `onyx`: 沉穩專業
- `nova`: 年輕活潑
- `shimmer`: 甜美可愛

### 模組功能

`modules/tts.js` 提供兩個函數：

1. **`synthesizeSpeech(text, outputPath)`**
   - 生成語音檔案並保存到指定路徑
   - 返回檔案路徑

2. **`synthesizeSpeechToBuffer(text)`**
   - 直接返回音頻 Buffer
   - 適合即時傳輸場景

## 🧪 測試流程

### 方法 1：使用測試腳本（推薦）

```bash
node test-tts.js
```

這會：
- 生成測試語音檔案到 `outputs/test-voice.mp3`
- 測試 Buffer 模式
- 顯示檔案大小和生成時間

### 方法 2：啟動伺服器並測試 API

```bash
# 終端 1：啟動伺服器
node server.js
```

```bash
# 終端 2：測試 API（PowerShell）
Invoke-WebRequest -Uri http://localhost:3000/api/speak -Method POST -ContentType "application/json" -Body '{"text":"你好，我是花小軟。"}' -OutFile soft.mp3
```

然後播放 `soft.mp3` 檔案。

### 方法 3：使用 Hoppscotch / Postman

**端點 1：返回檔案**
- URL: `http://localhost:3000/api/speak`
- Method: `POST`
- Body:
```json
{
  "text": "你好，我是花小軟。"
}
```
- Response: 直接下載 MP3 檔案

**端點 2：返回 Buffer（串流）**
- URL: `http://localhost:3000/api/speak-stream`
- Method: `POST`
- Body: 同上
- Response: 音頻串流（適合前端直接播放）

## 📊 API 端點說明

### `/api/speak`

生成語音檔案並返回檔案。

**請求：**
```json
POST /api/speak
Content-Type: application/json

{
  "text": "你好，我是花小軟。"
}
```

**回應：**
- 成功：返回 MP3 檔案
- 失敗：`{"error": "TTS failed"}`

### `/api/speak-stream`

生成語音並直接返回音頻 Buffer（串流模式）。

**請求：**
```json
POST /api/speak-stream
Content-Type: application/json

{
  "text": "你好，我是花小軟。"
}
```

**回應：**
- 成功：音頻串流（Content-Type: audio/mpeg）
- 失敗：`{"error": "TTS failed"}`

## 🎯 驗收標準

| 項目 | 驗收方式 | 成功條件 |
|------|----------|----------|
| 🎧 語音生成 | 播放生成的 MP3 | 聽到自然語氣、發音正確 |
| ⚙️ API 回傳 | 測試 `/api/speak` | 音檔可正確下載 |
| 📦 Buffer 模式 | 測試 `/api/speak-stream` | 音頻串流正常 |
| 🔐 安全性 | 檢查 `.env` | API key 不暴露 |
| 🪶 穩定性 | 多次請求 | 不崩潰，延遲 < 3 秒 |

## 🔗 完整對話流程

現在可以實現「自說自答」模式：

1. **接收文字** → `/api/chat` → GPT-4 生成回應
2. **語音合成** → `/api/speak` → 花小軟開口說話

**範例流程：**
```javascript
// 1. 獲取文字回應
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ text: "你好" })
});
const { reply } = await chatResponse.json();

// 2. 將回應轉為語音
const audioResponse = await fetch('/api/speak-stream', {
  method: 'POST',
  body: JSON.stringify({ text: reply })
});
const audioBlob = await audioResponse.blob();

// 3. 播放語音
const audio = new Audio(URL.createObjectURL(audioBlob));
audio.play();
```

## 📁 文件結構

```
Lingya_Voice_Agent/
├── modules/
│   ├── llm.js          # ✅ LLM 模組
│   └── tts.js          # ✅ TTS 模組（新增）
├── server.js           # ✅ 已更新（新增 /api/speak）
├── outputs/            # 📁 語音檔案輸出目錄（自動創建）
│   └── *.mp3          # 生成的語音檔案
└── test-tts.js         # 🧪 TTS 測試腳本
```

## 🐛 常見問題

### 1. 檔案生成失敗

**問題**：`TTS failed`  
**檢查**：
- `OPENAI_API_KEY` 是否正確
- API 配額是否充足
- 網路連接是否正常

### 2. 音色不符合預期

**解決**：修改 `.env` 中的 `TTS_VOICE` 參數，嘗試其他音色。

### 3. 檔案太大

**解決**：使用 `speak-stream` 端點，不保存檔案，直接傳輸。

## 🎉 下一步

完成 Step ② 後，花小軟已具備：
- ✅ 聽懂（LLM 理解文字）
- ✅ 回答（GPT-4 自然語氣）
- ✅ 說話（OpenAI TTS 語音輸出）

**Step ③ 預告：語音輸入模組（Whisper）**
- 實現「花小軟能聽懂人說話」
- 串接語音錄音、語音轉文字、對話回應全流程

