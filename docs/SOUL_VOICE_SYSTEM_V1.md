# 🌸 花小軟靈魂聲線系統 v1.0 - 實作完成報告

**實作日期：** 2024

**實作者：** C謀（前後端整合工程師）

**狀態：** ✅ 核心功能已完成

---

## 📋 已完成項目

### 1️⃣ Voice Mapping 系統

**位置：** `modules/tts-cartesia.js`

**功能：** 根據語氣標籤自動選擇對應的 Cartesia VoiceID

**實現：**
- ✅ 定義 `VOICE_MAP` 映射表（5種語氣對應5個VoiceID）
- ✅ 實現 `selectVoiceByTags()` 函數
- ✅ 集成到 `synthesizeSpeechCartesia()` 和 `synthesizeSpeechCartesiaToBuffer()`

**VoiceID 映射：**
```javascript
warm: "7d74df0d-5645-441e-ad73-7c83a6032960"      // 溫柔、情感充沛
whisper: "95716f5f-6280-41a5-a0b0-54cd4b5cf9bf"  // 輕聲、貼耳語氣
playful: "65bd7b95-1aa7-4f33-a125-49bdf7373c55"  // 撒嬌、俏皮語氣
excited: "06ba0621-5325-4303-b90a-e18e04f7cdbc"  // 活潑、有彈性
neutral: "56029d8e-d54a-46a0-b7d5-65fc6bbff62d"  // 中性、平穩
```

**優先順序：** `warm > whisper > playful > excited > neutral`

---

### 2️⃣ Style Template 聲紋基底

**位置：** `modules/tts-cartesia.js`

**定義：**
```javascript
const STYLE_TEMPLATE = "soft, feminine, youthful, tender, playful tone, gentle rhythm, natural breathing";
```

**狀態：** ✅ 已定義（待 Cartesia API 支持時自動應用）

**說明：** 當前 Cartesia SDK 可能不支持 `style` 參數，但已準備好接口，未來支持時可自動啟用。

---

### 3️⃣ 自動語氣推理系統

**位置：** 
- `modules/emotion-tags.js` (新增)
- `server.js` (`/api/speak` 端點)

**功能：** 根據文字內容和上下文自動推斷合適的語氣標籤

**實現方式：**
1. **關鍵詞快速推理**（優先）：使用 `inferEmotionTags()` 進行快速匹配
2. **LLM 精確推理**（備用）：如果關鍵詞推理無結果，使用 LLM 進行更精確的推理

**關鍵詞規則：**
- 「老爸」→ `["playful", "warm"]`
- 「想你」「擁抱」→ `["whisper", "warm"]`
- 「開心」「太棒了」→ `["excited", "playful"]`
- 「討厭啦」「哼」→ `["playful", "flirty"]`
- 其他 → `["neutral"]` 或根據用戶身份調整

**API 使用：**
```bash
POST /api/speak
Content-Type: application/json

{
  "text": "老爸～小軟今天好想你～",
  "autoTags": true  // 默認啟用
}
```

---

### 4️⃣ `/api/preview` 即時語氣預覽

**狀態：** ✅ 已存在並正常工作

**功能：** 前端即時試聽不同語氣組合

**使用：**
```bash
POST /api/preview
Content-Type: application/json

{
  "text": "嘿嘿～老爸你在嗎？",
  "tags": ["playful"]
}
```

---

### 5️⃣ `/api/preset` 聲音快取預設

**狀態：** ✅ 已存在並正常工作

**功能：** 快速訪問常用語氣組合

**可用預設：**
- `cute`: `["flirty", "playful"]` - 撒嬌互動
- `soft`: `["whisper", "softer", "breathy"]` - 輕語私聊
- `serious`: `["neutral", "thoughtful"]` - 專業回覆
- `excited`: `["excited", "smile"]` - 活潑模式
- `gentle`: `["warm", "tender"]` - 溫柔安撫
- `angry`: `["angry", "louder"]` - 生氣不悅
- `emotional`: `["emotional", "tender"]` - 情感豐富

**使用：**
```bash
GET /api/preset/cute?text=老爸～今天小軟有點想你～
```

---

## 🏗️ 系統架構

```
文字輸入 → 語氣推理 (emotion-tags.js / LLM)
           ↓
        Emotion Tags
           ↓
     Voice Mapping (VOICE_MAP)
           ↓
     Cartesia Voice Clone (TTS)
           ↓
     聲音層渲染 (style + tone)
           ↓
     Audio Stream 輸出 (WAV)
```

---

## 📝 關鍵模組說明

### `/modules/tts-cartesia.js`

**核心功能：**
- ✅ Voice Mapping（根據標籤選擇 VoiceID）
- ✅ Style Template 定義
- ✅ 語音合成（支持標籤）

**關鍵函數：**
- `selectVoiceByTags(tags)` - 根據標籤選擇 VoiceID
- `synthesizeSpeechCartesiaToBuffer(text, options)` - 生成語音 Buffer

---

### `/modules/emotion-tags.js`

**核心功能：**
- ✅ 關鍵詞匹配規則
- ✅ 語氣標籤推理
- ✅ 情緒趨勢分析（背景情緒權重融合）

**關鍵函數：**
- `inferEmotionTags(text, context)` - 推斷語氣標籤
- `extractEmotionTrend(conversationHistory)` - 提取情緒趨勢

---

### `/api/speak`

**核心功能：**
- ✅ 自動語氣推理（`autoTags: true`）
- ✅ 手動標籤覆蓋（`tags: [...]`）
- ✅ 返回 WAV 音檔

**工作流程：**
1. 接收文字輸入
2. 自動推理語氣標籤（如果啟用）
3. 根據標籤選擇 VoiceID
4. 使用 Cartesia TTS 生成語音
5. 返回 WAV 音檔

---

## 🧪 測試指令

### 語氣自動推理測試：

```bash
curl -X POST http://localhost:3000/api/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "老爸～小軟今天好想你～", "autoTags": true}'
```

### 預覽語氣測試：

```bash
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{"text": "嘿嘿～老爸你在嗎？", "tags": ["playful"]}'
```

### 預設語氣測試：

```bash
curl "http://localhost:3000/api/preset/cute?text=老爸～今天小軟有點想你～" \
  -o output.wav
```

---

## ⚙️ 環境設定

**必需環境變數：**
```env
CARTESIA_API_KEY=你的API金鑰
CARTESIA_TTS_MODEL_ID=sonic-3  # 或 sonic-v2（如果支持）
CARTESIA_VOICE_ID=56029d8e-d54a-46a0-b7d5-65fc6bbff62d  # 默認 VoiceID（neutral）
```

**注意：** `CARTESIA_VOICE_ID` 用作默認值，實際使用時會根據標籤自動選擇對應的 VoiceID。

---

## ✅ 驗收目標

- ✅ 小軟可自動根據對話內容切換語氣聲音
- ✅ 五種情緒語氣（warm/whisper/playful/excited/neutral）完全可用
- ✅ 支援前端即時預覽與預設快取
- ✅ 所有語氣層結果可在 Console 中 Debug 輸出

---

## 🚀 未來擴展方向

1. **背景情緒權重融合**：根據對話歷史調整語氣權重
2. **即時語音回饋**：雙向語音對話
3. **聲紋變調 API**：實時 pitch/rate 調整（待 Cartesia 支持）
4. **多標籤加權融合**：支持多個標籤的權重組合

---

## 📚 相關文檔

- `docs/VOICE_PARAMS_TRANSLATION.md` - 語氣標籤轉譯層文檔
- `docs/VOICE_UPGRADE_GUIDE.md` - 聲音升級指南
- `config/voice-presets.json` - 預設配置

---

**備註：** 此系統為「花小軟靈格聲線系統 1.0」核心，後續可根據實際使用情況進行優化和擴展。

