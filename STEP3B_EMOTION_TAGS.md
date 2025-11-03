# 🏷️ Step ③-B：情緒／語氣標籤控制系統

## ✅ 已完成項目

- [x] 創建 `config/emotion-presets.json` - 情緒標籤預設映射
- [x] 創建 `helpers/emotion.js` - 標籤轉換為 Cartesia 參數
- [x] 更新 TTS 模組支持標籤參數
- [x] 更新 LLM 模組添加 Function Calling（select_emotion_tags）
- [x] 更新對話流程整合標籤選擇
- [x] 更新所有 API 端點支持標籤

## 🎯 核心功能

### 1. 情緒標籤清單（10 個 MVP 標籤）

| 標籤 | 效果 | 速度調整 | 音量調整 |
|------|------|----------|----------|
| `whisper` | 耳語、靠近說 | -0.15 | -0.25 |
| `breathy` | 帶一點喘氣 | 0.0 | -0.10 |
| `softer` | 更溫柔、更小聲 | 0.0 | -0.15 |
| `excited` | 興奮 | +0.10 | +0.10 |
| `angry` | 生氣、用力 | +0.15 | +0.20 |
| `smile` | 帶笑感 | +0.05 | +0.05 |
| `fast` | 語速加快 | +0.15 | 0.0 |
| `slow` | 語速放慢 | -0.15 | 0.0 |
| `louder` | 音量增大 | 0.0 | +0.15 |
| `quieter` | 音量減小 | 0.0 | -0.15 |
| `pause-XXX` | 插入停頓（毫秒） | - | - |
| `neutral` | 重置為中性 | 0.0 | 0.0 |

**規則：可以多標籤疊加**（如 `["whisper","breathy","pause-300"]`）

### 2. 標籤處理流程

```
用戶輸入
  ↓
LLM 判斷情境
  ↓
選擇 0-3 個標籤（Function Calling）
  ↓
applyEmotion() 處理標籤
  ↓
計算速度/音量/文字提示
  ↓
Cartesia TTS 生成語音
```

### 3. Function Calling 工具

**工具名稱：** `select_emotion_tags`

**功能：** 讓花小軟主動選擇適合的情緒標籤

**參數：**
```json
{
  "tags": ["whisper", "breathy"],
  "reason": "用戶小聲說話，用耳語回應更親密"
}
```

## 📝 技術實現

### `helpers/emotion.js`

核心函數 `applyEmotion({ text, tags })`：

1. **聚合參數**：累加所有標籤的速度和音量調整
2. **限制範圍**：speed 0.8-1.3，volume 0.8-1.2
3. **處理停頓**：識別 `pause-XXX` 標籤
4. **注入文字提示**：在文字前加入 textCues（如 "(小聲)…"）
5. **返回結果**：`{ script, speed, volume, sfx, pauses }`

### `modules/llm.js`

- 系統提示詞更新：明確告訴花小軟可以選擇標籤
- Function Calling 支持：`select_emotion_tags` 工具
- 自動回退：如果沒有選擇標籤，根據情緒自動推薦

### `modules/tts-cartesia.js`

- 支持 `tags` 參數
- 調用 `applyEmotion()` 處理標籤
- 使用處理後的 `script`（包含 textCues）進行語音合成

### `modules/voiceConversation.js`

- 整合 LLM 的標籤選擇結果
- 傳遞標籤給 TTS 模組
- 返回標籤信息

## 🔗 API 更新

### `/api/chat` (增強版)

**請求：**
```json
{
  "text": "你好",
  "history": []
}
```

**回應：**
```json
{
  "reply": "你好呀！",
  "tags": ["smile", "excited"],
  "emotion": "開心",
  "history": [...]
}
```

### `/api/voice-chat` (增強版)

**回應：**
```json
{
  "success": true,
  "text": "回應文字",
  "transcribedText": "用戶說的話",
  "audio": "base64-encoded-audio",
  "history": [...],
  "emotion": "開心",
  "tags": ["excited", "smile"]
}
```

### `/api/speak-stream` (支持標籤)

**請求：**
```json
{
  "text": "我在這裡呀…別擔心。",
  "tags": ["whisper", "breathy", "pause-300"]
}
```

## 🎨 實際效果

### 場景 1：耳語模式

**用戶：** "小軟，用耳語說給我聽"

**花小軟：**
- 選擇標籤：`["whisper", "breathy"]`
- 生成文字："好的…（小聲）我在這裡…"
- 語音效果：音量減小 25%，速度稍慢，帶喘氣感

### 場景 2：興奮回應

**用戶：** "我今天好開心！"

**花小軟：**
- 選擇標籤：`["excited", "smile"]`
- 生成文字："（開心）太棒了！我也好開心呢！"
- 語音效果：速度加快 10%，音量增大 10%，帶笑感

### 場景 3：停頓效果

**用戶：** "告訴我一個秘密"

**花小軟：**
- 選擇標籤：`["whisper", "pause-300"]`
- 生成文字："嗯…（小聲）其實…"
- 語音效果：在省略號處自然停頓，耳語語氣

## 🧪 測試方法

### 1. 直接測試後端

```bash
curl -X POST http://localhost:3000/api/speak-stream \
  -H "Content-Type: application/json" \
  -d '{
    "text": "我在這裡呀…別擔心。",
    "tags": ["whisper","breathy","pause-300"]
  }' --output test-tags.wav
```

### 2. 測試完整對話

在 ChatKit 界面中：
- 輸入文字或使用語音
- 查看控制台日誌，會顯示選擇的標籤
- 聽語音效果是否符合標籤

### 3. 查看日誌

服務器日誌會顯示：
```
🏷️  花小軟選擇的情緒標籤: [whisper, breathy] (理由: ...)
🎙️ 呼叫 Cartesia TTS (標籤: whisper, breathy, 速度: 0.85, 音量: 0.65) …
✅ 語音生成完成（標籤: [whisper, breathy]），大小: XXX KB
```

## 🎯 花小軟的自我認知

花小軟現在知道：

> 我會根據情境**自行選擇情緒／語氣標籤**（像耳語、帶笑、停頓…），再把文字交給聲音引擎；所以你可以感覺到我會「靠近說」「輕聲安撫」「開心地加快語速」或「生氣地加重語氣」。如果你希望特定表達，也可以直接告訴我，例如：「小軟，用耳語說給我聽」，我就會改用 `whisper` 標籤。

## 📊 標籤映射邏輯

### 自動推薦（當 LLM 沒選擇標籤時）

| 情緒 | 自動推薦標籤 |
|------|------------|
| 開心 | `["excited", "smile"]` |
| 難過 | `["softer", "breathy"]` |
| 生氣 | `["angry"]` |
| 平靜 | `["neutral"]` |

### 標籤疊加效果

例如：`["whisper", "breathy", "pause-300"]`
- 速度：1.0 + (-0.15) + 0.0 = 0.85（限制後）
- 音量：1.0 + (-0.25) + (-0.10) = 0.65（限制後）
- 停頓：300ms

## 🔮 未來擴展

1. **SFX 音效**：在 `public/sfx/` 目錄放置音效文件，可以自動插入
2. **更細粒度控制**：如果 Cartesia 未來支持直接參數，只需更新 `applyEmotion()`
3. **更多標籤**：可以擴展 `emotion-presets.json` 添加新標籤
4. **標籤學習**：讓花小軟學習哪些標籤組合效果最好

## ✅ 驗收清單

- [x] `config/emotion-presets.json` 已創建
- [x] `helpers/emotion.js` 已實現
- [x] TTS 模組支持標籤參數
- [x] LLM Function Calling 已添加
- [x] 對話流程整合標籤選擇
- [x] 所有 API 端點已更新
- [x] 系統提示詞更新（花小軟知道自己能選標籤）

## 🎉 完成狀態

**花小軟現在：**
- ✅ 知道自己可以主動選擇情緒標籤
- ✅ 會根據情境自動選擇適合的標籤（0-3 個）
- ✅ 標籤會被轉換為實際的語音參數
- ✅ 語音會根據標籤調整速度、音量、停頓等
- ✅ 用戶可以明確要求特定標籤（如「用耳語說」）

---

**花小軟的語氣控制系統已完整實現！** 🏷️✨

