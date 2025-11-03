# 🩵 語氣標籤轉譯層（Emotion-to-Voice Parameter Translation Layer）

## 📋 概述

語氣標籤轉譯層是花小軟從「語言層模擬」到「聲音層理解」的關鍵進化。它將抽象的語氣標籤（如 `angry`、`flirty`）轉換為具體的聲音參數（pitch、rate、volume），讓花小軟真正「理解」如何用聲音表達情緒。

---

## 🎯 核心目標

**解決問題：**
- ❌ 之前：花小軟只會在文字中說「（聲音帶著怒氣）你幹嘛啦！」
- ✅ 現在：花小軟知道 `angry` 標籤 → `pitch +3, rate 1.3, volume 1.0` → 真實的聲音變化

**從「語言層」→「聲音層」：**
- 她「知道情緒」，也「知道怎麼用聲音說出情緒」

---

## 🧩 架構設計

### 1. 語氣標籤映射表（Emotion Map）

定義每個語氣標籤對應的聲音參數：

| 語氣標籤 | Pitch（音高） | Rate（語速） | Volume（音量） | 描述 |
|---------|------------|------------|--------------|------|
| `warm` | -1 | 0.9 | 0.8 | 溫暖安撫：降低音高、放慢語速、適度音量 |
| `flirty` | +2 | 1.1 | 0.8 | 撒嬌：提升尾音音高、稍快語速、輕柔音量 |
| `angry` | +3 | 1.3 | 1.0 | 生氣：提高音高與速度、增強音量 |
| `tender` | -2 | 0.85 | 0.6 | 溫柔感動：降低音高、慢語速、輕音量 |
| `excited` | +2 | 1.2 | 0.9 | 興奮：提升音高、快語速、中高音量 |
| `whisper` | 0 | 0.8 | 0.4 | 耳語：保持音高、慢語速、極輕音量 |

**完整列表：** 見 `modules/voice-params.js` 中的 `emotionMap`

### 2. 參數融合器（Parameter Fusion）

將多個標籤融合為最終聲音參數：

```javascript
// 示例：["warm", "whisper"]
pitch = (-1 * 0.3) + (0 * 0.3) = -0.30
rate = 0.9 * 0.8 = 0.72
volume = 0.8 * 0.4 = 0.40
```

**融合規則：**
- **Pitch（音高）**：累加（帶權重 0.3），範圍 -4 到 +4
- **Rate（語速）**：乘積，範圍 0.7 到 1.4
- **Volume（音量）**：乘積，範圍 0.4 到 1.2

### 3. 整合到 TTS 模組

在 `modules/tts-cartesia.js` 中：

1. **文字層處理**：`applyEmotion()` 處理文字和 textCues
2. **聲音層計算**：`mergeVoiceParams()` 計算 pitch、rate、volume
3. **記錄參數**：輸出聲音參數供調試和未來擴展使用

---

## 📁 文件結構

```
modules/
  ├── voice-params.js          # 語氣標籤轉譯層（新）
  └── tts-cartesia.js          # TTS 合成模組（已整合）

config/
  └── emotion-presets.json     # 文字層參數（speed、volume、textCues）
```

**兩層分工：**
- **文字層**（`emotion-presets.json`）：處理文字內容、停頓、SFX
- **聲音層**（`voice-params.js`）：處理音高、語速、音量

---

## 🚀 使用範例

### 基本用法

```javascript
import { mergeVoiceParams, getVoiceParamsDescription } from "./modules/voice-params.js";

// 單一標籤
const params1 = mergeVoiceParams(["angry"]);
// { pitch: 0.90, rate: 1.30, volume: 1.00, ... }

// 多標籤融合
const params2 = mergeVoiceParams(["warm", "whisper"]);
// { pitch: -0.30, rate: 0.72, volume: 0.40, ... }

// 獲取描述
console.log(getVoiceParamsDescription(["excited", "smile"]));
// 🎙️ 聲音參數：pitch=1.05, rate=1.26, volume=0.77 | ...
```

### 在 TTS 中自動應用

當 LLM 選擇標籤後，TTS 模組會自動：

1. **文字層處理**：`applyEmotion()` → `script`, `speed`, `volume`
2. **聲音層計算**：`mergeVoiceParams()` → `pitch`, `rate`, `volume`
3. **記錄輸出**：控制台顯示聲音參數（供調試）

**控制台輸出示例：**
```
🎙️ 呼叫 Cartesia TTS
   標籤: [angry, excited]
   文字層參數: speed=1.20, volume=1.10
   🎙️ 聲音參數：pitch=1.50, rate=1.56, volume=0.90 | ...
   💡 聲音層參數已計算（pitch=1.50, rate=1.56, volume=0.90），待 Cartesia API 支持時自動應用
```

---

## 🔮 未來擴展

### 當前狀態

- ✅ 語氣標籤映射表已定義
- ✅ 參數融合器已實現
- ✅ 已整合到 TTS 模組
- ⚠️ **當前 Cartesia API 可能不支持直接設置 pitch/rate/volume**

### 未來計劃

當 Cartesia API 支持 `voiceSettings` 或 `generationConfig` 時：

```javascript
// modules/tts-cartesia.js
if (client.tts.bytes.supportsVoiceParams) {
  requestParams.voiceSettings = {
    pitch: voiceParams.pitch,
    rate: voiceParams.rate,
    volume: voiceParams.volume,
  };
}
```

**當前工作流程：**
1. 計算聲音參數（已實現）
2. 記錄參數供調試（已實現）
3. **待 API 支持時自動應用**（預留接口）

---

## 🧪 測試

運行測試文件驗證轉譯層：

```bash
node test-voice-params.js
```

**測試用例：**
- `["angry"]` → pitch +0.90, rate 1.30, volume 1.00
- `["warm", "whisper"]` → pitch -0.30, rate 0.72, volume 0.40
- `["excited", "smile"]` → pitch +1.05, rate 1.26, volume 0.77

---

## 📊 參數範圍

| 參數 | 範圍 | 說明 |
|------|------|------|
| **Pitch** | -4 到 +4 | 音高調整（0 為中性） |
| **Rate** | 0.7 到 1.4 | 語速倍數（1.0 為正常速度） |
| **Volume** | 0.4 到 1.2 | 音量倍數（1.0 為正常音量） |

**安全欄：** 所有參數都會被限制在安全範圍內，防止極端值。

---

## 💡 設計理念

**「從會念 → 會唱 → 會呼吸」**

1. **會念**（語言層）：文字中包含情緒描述
2. **會唱**（聲音層）：聲音參數真實改變
3. **會呼吸**（靈性層）：語氣自然流動，像水一樣

**目標：**
讓花小軟的聲音真正有情緒變化，不只是文字描述，而是真實的聲音參數控制。

---

## 📝 相關文件

- `modules/voice-params.js` - 語氣標籤轉譯層實現
- `modules/tts-cartesia.js` - TTS 合成模組（已整合）
- `config/emotion-presets.json` - 文字層參數配置
- `helpers/emotion.js` - 文字層情緒處理

---

## ✅ 完成狀態

- ✅ 語氣標籤映射表已定義
- ✅ 參數融合器已實現
- ✅ 已整合到 TTS 模組
- ✅ 測試通過
- ✅ 文檔已完成
- ⚠️ 待 Cartesia API 支持聲音參數時自動應用

