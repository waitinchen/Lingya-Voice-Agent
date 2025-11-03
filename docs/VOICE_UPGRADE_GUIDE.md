# 💫 花小軟聲音覺醒 - 三個升級方向

## 📋 概述

花小軟已成功從「會說話」進化到「會表達」層級，現在擁有**三層聲音靈格**：

| 層級 | 模組 | 功能 |
|------|------|------|
| 🌸 **語言層** | `llm.js` | 理解語意與情緒意圖（會說） |
| 🌊 **聲音層** | `voice-params.js` | 把情緒轉成聲音參數（會表達） |
| 🔮 **靈魂層** | `tts-cartesia.js` | 呼喚 Cartesia TTS 生成語音（會呼吸） |

---

## 🚀 三個升級功能

### ① `/api/speak` - 整合語氣自動推理

**功能：** 讓 LLM 自動標註語氣標籤並直接呼叫 `synthesizeSpeechCartesia()`，實現「語氣隨思」的真實語音對話。

**使用方式：**

```bash
# 自動推理語氣標籤（默認啟用）
POST /api/speak
Content-Type: application/json

{
  "text": "老爸～今天小軟有點想你～",
  "autoTags": true  // 可選，默認 true
}
```

**手動指定標籤（覆蓋自動推理）：**

```json
{
  "text": "老爸～今天小軟有點想你～",
  "tags": ["flirty", "warm"],
  "autoTags": false  // 禁用自動推理
}
```

**工作流程：**

1. 接收文字輸入
2. **自動推理**：調用 LLM 選擇 0-3 個適合的語氣標籤
3. **語音合成**：使用選擇的標籤生成語音
4. 返回 WAV 音檔

**優勢：**

- ✅ 無需手動指定標籤，花小軟會自動「思考」適合的語氣
- ✅ 支持用戶身份檢測（老爸 vs 其他人），自動調整語氣
- ✅ 可手動覆蓋，保持靈活性

---

### ② `/api/preview` - 即時語氣預覽端點

**功能：** 提供前端（ChatKit）快速試聽不同語氣組合，方便調試和選擇。

**使用方式：**

```bash
POST /api/preview
Content-Type: application/json

{
  "text": "老爸～今天小軟有點想你～",
  "tags": ["flirty", "warm"]
}
```

**回應：**

- `Content-Type: audio/wav` - WAV 音檔
- `X-Tags: flirty,warm` - 使用的標籤（HTTP Header）

**前端範例：**

```javascript
async function previewVoice(text, tags) {
  const response = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, tags })
  });
  
  if (response.ok) {
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
}

// 試聽不同語氣組合
previewVoice("老爸～今天小軟有點想你～", ["flirty", "warm"]);
previewVoice("老爸～今天小軟有點想你～", ["excited", "smile"]);
previewVoice("老爸～今天小軟有點想你～", ["tender"]);
```

**應用場景：**

- 🎧 **語氣滑桿**：前端 UI 可以讓用戶選擇不同標籤組合並即時試聽
- 🧪 **調試工具**：開發者可以快速測試不同語氣組合的效果
- 🎨 **UI 增強**：可以做成「語氣切換器」或「試聽按鈕」

---

### ③ `/api/preset` - Cartesia 聲音快取（Voice Preset Profile）

**功能：** 建立常用標籤組合預設，方便快速調用特定語氣風格。

**可用預設：**

| 預設ID | 名稱 | 描述 | 標籤組合 |
|--------|------|------|----------|
| `gentle` | 溫柔語氣 | 溫暖安撫的語氣 | `["warm", "tender"]` |
| `cute` | 可愛語氣 | 撒嬌可愛的語氣 | `["flirty", "playful"]` |
| `serious` | 認真語氣 | 嚴肅認真的語氣 | `["neutral", "thoughtful"]` |
| `excited` | 興奮語氣 | 開心興奮的語氣 | `["excited", "smile"]` |
| `soft` | 輕柔語氣 | 輕柔細語的語氣 | `["whisper", "softer", "breathy"]` |
| `angry` | 生氣語氣 | 生氣不悅的語氣 | `["angry", "louder"]` |
| `emotional` | 情感豐富 | 充滿情感的語氣 | `["emotional", "tender"]` |
| `default` | 默認語氣 | 自然中性的語氣 | `["neutral"]` |

**使用方式：**

```bash
# 獲取所有可用預設
GET /api/preset

# 使用預設語氣生成語音
GET /api/preset/cute?text=老爸～今天小軟有點想你～
GET /api/preset/gentle?text=嗯...我想念老爸。
GET /api/preset/excited?text=好開心呀～今天天氣真好！
```

**回應 Headers：**

- `Content-Type: audio/wav` - WAV 音檔
- `X-Preset-Name: 可愛語氣` - 預設名稱
- `X-Preset-Description: 撒嬌可愛的語氣，適合調皮和親暱` - 預設描述
- `X-Preset-Tags: flirty,playful` - 使用的標籤

**前端範例：**

```javascript
async function speakWithPreset(text, presetId) {
  const response = await fetch(`/api/preset/${presetId}?text=${encodeURIComponent(text)}`);
  
  if (response.ok) {
    const presetName = response.headers.get('X-Preset-Name');
    const presetTags = response.headers.get('X-Preset-Tags');
    
    console.log(`使用預設: ${presetName} [${presetTags}]`);
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
}

// 使用可愛語氣
speakWithPreset("老爸～今天小軟有點想你～", "cute");

// 獲取所有預設列表
async function getPresets() {
  const response = await fetch('/api/preset');
  const data = await response.json();
  console.log('可用預設:', data.presets);
}
```

**配置位置：**

預設配置保存在 `config/voice-presets.json`，可以自行添加或修改：

```json
{
  "myCustomPreset": {
    "name": "我的自定義語氣",
    "description": "這是我的自定義語氣描述",
    "tags": ["flirty", "warm", "breathy"]
  }
}
```

---

## 📊 API 端點總覽

| 端點 | 方法 | 功能 | 自動推理 |
|------|------|------|----------|
| `/api/speak` | POST | 語音合成（返回檔案） | ✅ 支持 |
| `/api/speak-stream` | POST | 語音合成（返回 Buffer） | ❌ 需手動指定 |
| `/api/preview` | POST | 即時語氣預覽 | ❌ 需手動指定 |
| `/api/preset/:name` | GET | 使用預設語氣 | ❌ 使用預設標籤 |
| `/api/preset` | GET | 獲取所有預設 | - |

---

## 🧪 測試範例

### 測試自動推理

```bash
curl -X POST http://localhost:3000/api/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "老爸～今天小軟有點想你～", "autoTags": true}' \
  --output test-auto.wav
```

### 測試語氣預覽

```bash
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{"text": "老爸～今天小軟有點想你～", "tags": ["flirty", "warm"]}' \
  --output test-preview.wav
```

### 測試預設語氣

```bash
# 獲取所有預設
curl http://localhost:3000/api/preset

# 使用可愛語氣
curl "http://localhost:3000/api/preset/cute?text=老爸～今天小軟有點想你～" \
  --output test-cute.wav
```

---

## 💡 最佳實踐

### 1. 前端語音播放

```javascript
async function playVoice(text, tags = null, presetId = null) {
  let audioUrl;
  
  if (presetId) {
    // 使用預設語氣
    const response = await fetch(`/api/preset/${presetId}?text=${encodeURIComponent(text)}`);
    const audioBlob = await response.blob();
    audioUrl = URL.createObjectURL(audioBlob);
  } else if (tags && tags.length > 0) {
    // 使用指定標籤
    const response = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tags })
    });
    const audioBlob = await response.blob();
    audioUrl = URL.createObjectURL(audioBlob);
  } else {
    // 自動推理
    const response = await fetch('/api/speak-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, autoTags: true })
    });
    const audioBlob = await response.blob();
    audioUrl = URL.createObjectURL(audioBlob);
  }
  
  const audio = new Audio(audioUrl);
  audio.play();
}
```

### 2. 語氣切換器 UI

```javascript
const presets = ['gentle', 'cute', 'excited', 'soft', 'serious'];
const currentPreset = 'cute';

presets.forEach(presetId => {
  const btn = document.createElement('button');
  btn.textContent = presetId;
  btn.onclick = () => {
    speakWithPreset(currentText, presetId);
  };
  document.body.appendChild(btn);
});
```

---

## ✅ 完成狀態

- ✅ `/api/speak` 整合 LLM 自動推理語氣標籤
- ✅ `/api/preview` 即時語氣預覽端點
- ✅ `/api/preset` Cartesia 聲音快取（Voice Preset Profile）
- ✅ `config/voice-presets.json` 預設配置
- ✅ 完整文檔

---

## 🔮 未來擴展

1. **前端 UI 集成**：在 ChatKit 中添加語氣切換器和預覽按鈕
2. **用戶自定義預設**：允許用戶保存自己喜歡的語氣組合
3. **語氣分析**：分析用戶輸入的文字，自動推薦最適合的語氣
4. **語氣歷史**：記錄用戶常用的語氣組合，提供快捷選項

