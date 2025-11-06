# 語音轉譯層技術文檔

## 📘 概述

語音轉譯層（Speech Rewrite Layer）是插入在 LLM 輸出和 TTS 之間的中間層，負責將 LLM 生成的正式文字轉換為更口語化、更符合角色性格的語音文本。

**目標：** 讓黃蓉講話不再是「唸稿子」，而是「講人話」——靈動 × 撩人 × 狡猾的那種人話 😏

---

## 🧩 系統架構

```
使用者提問
    ↓
ChatKit 輸入
    ↓
LLM 回應文字
    ↓
🎭 語音轉譯層 rewriteForSpeech()
    ↓
Cartesia 語音合成 TTS
    ↓
播出聲音
```

---

## 📁 文件結構

```
modules/speech-layer/
├── rewriteForSpeech.js          # 主函數入口
├── personaStyleConfigs/          # 角色語氣規則配置
│   └── RONG-001.json            # 黃蓉語氣規則
└── helpers/
    ├── punctuationFixer.js      # 標點符號優化器
    ├── tailParticleAdder.js     # 語助詞注入器
    └── expressionReplacer.js   # 表達替換器
```

---

## ⚙️ 核心功能

### 1. 表達替換（Expression Replacement）

將正式表達替換為更符合角色性格的口語化表達。

**示例：**
- `"我知道"` → `"我才不信你猜不到～"`
- `"我不會說"` → `"我偏不告訴你唷～"`
- `"你是誰"` → `"你猜猜看呀～"`

### 2. 標點符號優化（Punctuation Fixes）

將正式標點轉換為更口語化的標點。

**規則：**
- `"。"` → `"～"`
- `"，"` → `"，嗯～"`
- `"？"` → `"呀？"`

### 3. 語助詞注入（Tail Particle Injection）

在句尾隨機添加語助詞，增加口語感。

**語助詞列表：**
- `"啦～"`, `"哼～"`, `"唄～"`, `"咩～"`, `"喔～"`, `"唷～"`, `"呀～"`, `"嘛～"`, `"呢～"`, `"吧～"`

**注入規則：**
- 概率：40%（可配置）
- 最小文本長度：5 字符
- 最大文本長度：50 字符
- 避免重複（如果已有語助詞，不重複添加）

### 4. 禁止短語檢測（Forbidden Phrase Detection）

檢測並阻止角色說出不符合設定的短語。

**禁止短語列表：**
- `"我是黃蓉"`
- `"我來自金庸"`
- `"我是一個AI"`
- `"我是一個虛擬角色"`

如果檢測到禁止短語，會返回配置的 fallback 回應。

### 5. 情緒風格切換（Emotion Style Switching）

根據情緒標籤自動切換語氣風格。

**支持的情緒風格：**
- `playful` - 俏皮
- `teasing` - 調戲
- `flirty` - 撒嬌
- `confident` - 自信

每種情緒風格都有對應的語助詞和標點規則。

---

## 🔧 使用方法

### 基本用法

```javascript
import { rewriteForSpeech } from "./modules/speech-layer/rewriteForSpeech.js";

const llmOutput = "我知道你是誰，但我不會說。";
const spokenText = rewriteForSpeech(llmOutput, "RONG-001", {
  emotionTags: ["playful", "teasing"],
});

// 輸出: "我才不信你猜不到～，嗯～我偏不告訴你唷～"
```

### 集成到 TTS 流程

語音轉譯層已自動集成到以下 TTS 函數：

1. **流式 TTS** (`synthesizeSpeechCartesiaStream`)
   - 在 `modules/tts-cartesia-stream.js` 中自動調用
   - 支持 WebSocket 流式語音

2. **非流式 TTS** (`synthesizeSpeechCartesia`)
   - 在 `modules/tts-cartesia.js` 中自動調用
   - 用於 HTTP API 端點

3. **Buffer TTS** (`synthesizeSpeechCartesiaToBuffer`)
   - 在 `modules/tts-cartesia.js` 中自動調用
   - 返回音頻 Buffer

---

## 📝 配置格式

### 角色配置文件（JSON）

```json
{
  "personaId": "RONG-001",
  "personaName": "黃蓉",
  "version": "1.0",
  
  "punctuationRules": {
    "。": "～",
    "，": "，嗯～",
    "？": "呀？"
  },
  
  "expressionMap": {
    "我知道": "我才不信你猜不到～",
    "我不會說": "我偏不告訴你唷～"
  },
  
  "tailParticles": [
    "啦～", "哼～", "唄～", "咩～", "喔～", "唷～"
  ],
  
  "injectionRules": {
    "minLength": 5,
    "maxLength": 50,
    "probability": 0.4,
    "positions": ["end", "middle"]
  },
  
  "forbiddenPhrases": [
    "我是黃蓉",
    "我來自金庸"
  ],
  
  "fallbackResponse": "哎呀～你這麼問，是想聽故事還是想聽我撒嬌呀？",
  
  "emotionStyles": {
    "playful": {
      "tailParticles": ["啦～", "唄～", "咩～", "喔～"],
      "punctuation": {
        "。": "～",
        "？": "呀？"
      }
    }
  }
}
```

---

## 🧪 測試用例

| 輸入 LLM 文本 | 預期轉譯後語音文本 |
| ------------ | ----------------- |
| `我知道你是誰。` | `我才不信你猜不到～` |
| `這是我的秘密。` | `這呀～是我不輕易說的秘密唷～` |
| `我不會說。` | `嘻嘻，我才不說給你聽咧～` |
| `我是黃蓉，桃花島的大小姐。` | `哎呀～你這麼問，是想聽故事還是想聽我撒嬌呀？` (fallback) |

---

## 🚀 性能優化

1. **配置緩存**：角色配置會緩存在內存中，避免重複讀取文件
2. **錯誤處理**：如果轉譯失敗，自動回退到原始文本，不影響 TTS 流程
3. **輕量級處理**：所有轉換都是字符串操作，開銷極低

---

## 🔮 未來擴展方向

1. **停頓控制**：如果語音引擎支持，可注入 `<break>` tag（SSML）
2. **情緒風格切換**：配合情緒解析器，自動判斷使用「撒嬌」、「警告」、「示弱」哪一種語氣包
3. **上下文感知**：根據對話上下文調整轉譯策略
4. **多角色支持**：為不同角色創建不同的配置文件

---

## 📌 備註

- 語音轉譯層只影響 TTS 輸入，不影響 LLM 輸出（前端顯示的文本）
- 轉譯過程是**不可逆**的，確保原始文本在 LLM 回應中保留
- 所有轉譯規則都可以通過配置文件輕鬆調整，無需修改代碼

---

**最後更新：** 2025-11-05


