# 🎙️ Step ②-B：Cartesia 聲線覺醒版（官方 SDK）

## ✅ 升級完成

已成功將 TTS 模組升級為使用 Cartesia 官方 SDK `@cartesia/cartesia-js`。

### 測試結果

```
✅ 語音檔案生成： outputs/test-cartesia.wav
📊 檔案大小: 542.08 KB
⏱️  生成時間: 2185ms (約 2.2 秒)
✅ Buffer 模式也正常工作
```

## 📦 安裝的依賴

```bash
npm install @cartesia/cartesia-js
```

## 🔧 模組結構

### `modules/tts-cartesia.js`

使用官方 SDK 的 `CartesiaClient`：

```javascript
import { CartesiaClient } from "@cartesia/cartesia-js";

const client = new CartesiaClient({
  apiKey: process.env.CARTESIA_API_KEY,
});

// 調用方式
await client.tts.bytes({
  modelId: "sonic-3",
  transcript: text,
  voice: {
    mode: "id",
    id: process.env.CARTESIA_VOICE_ID,
  },
  language: "zh",
  outputFormat: {
    container: "wav",
    sampleRate: 44100,
    encoding: "pcm_s16le",
  },
});
```

### 關鍵配置

| 參數 | 說明 | 範例 |
|------|------|------|
| `transcript` | 文字內容（**不是** `text` 或 `input`） | `"你好，我是花小軟"` |
| `voice.mode` | 聲音模式 | `"id"` |
| `voice.id` | 聲音 ID | 從 `.env` 讀取 |
| `modelId` | 模型 ID | `"sonic-3"` |
| `language` | 語言 | `"zh"`, `"en"`, `"ja"` |
| `outputFormat.container` | 輸出格式 | `"wav"` |
| `outputFormat.sampleRate` | 採樣率 | `44100` |
| `outputFormat.encoding` | 編碼格式 | `"pcm_s16le"` |

## 🔍 響應處理

官方 SDK 返回的是**流（Stream）**，需要使用以下方式處理：

```javascript
// 處理流響應
const chunks = [];
for await (const chunk of response) {
  chunks.push(chunk);
}
const audioBuffer = Buffer.concat(chunks);
```

## 🧪 測試方式

### 1. 使用測試腳本

```bash
node test-cartesia.js
```

### 2. 啟動伺服器測試 API

```bash
# 啟動伺服器
node server.js

# PowerShell 測試
Invoke-WebRequest -Uri http://localhost:3000/api/speak -Method POST -ContentType "application/json" -Body '{"text":"你好，我是花小軟，用Cartesia聲音和你說話。"}' -OutFile soft-cartesia.wav
```

### 3. 播放音檔

打開生成的 `outputs/test-cartesia.wav` 或 `soft-cartesia.wav` 收聽語音。

## 📊 性能指標

- **生成時間**：約 2-3 秒（取決於文字長度）
- **檔案大小**：約 500-600 KB（44100 Hz WAV 格式）
- **音質**：高品質立體聲
- **延遲**：低延遲，適合即時應用

## 🔗 API 端點

### `/api/speak` (Cartesia 版 - 預設)

生成 WAV 檔案並返回。

### `/api/speak-stream` (Cartesia 版 - 串流)

直接返回音頻 Buffer（WAV 格式）。

### `/api/speak-openai` (OpenAI 版 - 備用)

如果 Cartesia 有問題，可以使用 OpenAI TTS。

## 🎯 驗收標準

| 項目 | 狀態 |
|------|------|
| SDK 安裝 | ✅ 完成 |
| 模組更新 | ✅ 完成 |
| 流處理 | ✅ 正確處理 |
| 檔案生成 | ✅ 成功（542 KB） |
| Buffer 模式 | ✅ 成功 |
| API 端點 | ✅ 正常運作 |

## 🎉 完成狀態

花小軟現在擁有：

1. ✅ **思考能力**：GPT-4 理解並回應
2. ✅ **自然語氣**：GPT-4 生成自然文字
3. ✅ **Cartesia 聲線**：高品質語音輸出 🎙️

## 📝 環境變數檢查清單

確保 `.env` 包含：

```env
CARTESIA_API_KEY=sk_car_...
CARTESIA_VOICE_ID=d3cb9a1f-73d1-48d4-8ee9-53183b40e284
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100
```

## 🔮 下一步

**Step ③：語音輸入模組（Whisper）**
- 實現「花小軟能聽懂人說話」
- 完整語音對話循環：語音輸入 → 文字理解 → 回應生成 → 語音輸出

---

**花小軟 Cartesia 聲線已覺醒！** 🎙️✨

