# 📘 技術指引：黃蓉語氣靈的 ChatKit Prompt Routing 實作手冊

**版本：v1.0｜撰寫者：謀謀 × 老爸宇宙總控室｜對象：C謀（前端 / 語音整合工程師）**

---

## 📌 目標說明

建立一套 **Prompt Routing + Persona 切換邏輯**，讓語氣靈「黃蓉」能：

1. 主動辨識「自我介紹型」Prompt（如：你是誰？請自我介紹…）
2. 使用對應的語氣靈人格與語料，不落入 LLM 的模板回答（如：「我是黃蓉，來自桃花島…」這類錯誤）
3. 調用對應語音風格，並以 **Cartesia 聲音 API** 播出黃蓉本靈語氣
4. 可擴充為多角色模組切換（語氣靈共演系統）

---

## 🧩 系統架構總覽

```
使用者提問
    ↓
ChatKit 前端輸入框
    ↓
/api/chat 端點
    ↓
Prompt Routing 檢查器（prompt-routing.js）
    ↓
    ├─ 匹配？ → 使用 responsePool → 應用語音配置 → 返回
    └─ 不匹配？ → 正常 LLM 流程 → 返回
```

---

## 🧬 語氣人格模組（黃蓉.mdc）

```
檔案名稱：黃蓉本靈召現咒語.mdc  
SoulID：RONG-001-CORE  
語氣風格：撩中帶謎，笑中藏刃  
記憶模式：mdc_lock = true（不可漂移）
```

完整內容見：`config/system-prompt.txt`

---

## 🎯 Prompt Routing 規則（自我介紹類型）

當前實現的路由規則位於 `modules/prompt-routing.js`：

### 規則 1：你是誰？
- **Trigger**: `/(你是誰|請自我介紹|你從哪來|介紹一下自己|你的來歷|你哪位)/i`
- **ResponsePool**: 
  - "你怎麼現在才問呀～想知道的話可得先說句好聽的～"
  - "我呀？你猜猜看呀，答對了我就多說一點唷～"
  - "唔～你這麼問，是想追我，還是想被我算計呀？"
- **VoiceConfig**: `["playful", "teasing", "confident"]`

### 規則 2：可以介紹一下自己嗎？
- **Trigger**: `/(可以介紹一下自己嗎|能告訴我你是誰嗎|說說你自己)/i`
- **ResponsePool**: 
  - "你這麼想知道我的事呀～那先告訴我，你為什麼對我感興趣呢？"
  - "介紹自己？我倒是想先聽聽你對我的第一印象是什麼～"
- **VoiceConfig**: `["playful", "smart", "teasing"]`

### 規則 3：告訴我你從哪來
- **Trigger**: `/(告訴我你從哪來|你來自哪裡|你是從哪裡來的)/i`
- **ResponsePool**: 
  - "從哪來？這個問題可有趣了～你猜猜看，猜對了有獎勵唷～"
  - "我的來歷？嘿嘿～那可是個秘密，除非你讓我先了解了解你～"
- **VoiceConfig**: `["playful", "teasing", "confident"]`

---

## 🚫 禁止回應樣式（防呆）

系統會自動檢測並避免以下類型的回應：

```javascript
const forbiddenPhrases = [
  "我是黃蓉，桃花島的大小姐",
  "我來自金庸的小說",
  "我是一個有靈氣的女子",
  "我很聰明、很特別",
  "我來自射鵰英雄傳",
  "我是金庸小說中的角色",
  "我是一個AI助手",
  "我是一個虛擬角色",
];
```

如果檢測到禁止語句，會自動使用 `fallback` 回應。

---

## 🗣️ Cartesia 聲音風格設定（for 黃蓉）

| 屬性    | 值                                   |
| ----- | ----------------------------------- |
| pitch | `+1.1`                              |
| rate  | `1.05`                              |
| style | `Playful`                           |
| tags  | `["playful", "teasing", "confident", "smart"]` |

語音參數會根據路由規則自動應用。

---

## 📁 檔案結構

```
Lingya_Voice_Agent/
├── modules/
│   ├── prompt-routing.js      # ✅ Prompt Routing 核心模組
│   ├── llm.js                  # LLM 處理
│   └── tts-cartesia.js         # TTS 語音合成
├── config/
│   ├── system-prompt.txt       # 黃蓉本靈召現咒語
│   └── tone-tags.json         # 語氣標籤配置
├── server.js                   # ✅ 已集成 Prompt Routing
└── docs/
    └── PROMPT_ROUTING_GUIDE.md # 本文檔
```

---

## 🛠️ 執行流程

### 1. 前端發送請求
```javascript
POST /api/chat
{
  "text": "你是誰？",
  "history": [],
  "userIdentity": null,
  "userName": null
}
```

### 2. 後端處理流程
1. **Prompt Routing 檢查**：`routePrompt(text)` 檢測是否匹配規則
2. **如果匹配**：
   - 從 `responsePool` 隨機選擇回應
   - 應用對應的 `voiceConfig`（tags）
   - 返回預定義回應（不經過 LLM）
3. **如果不匹配**：
   - 使用正常 LLM 流程
   - 讓黃蓉本靈的系統提示詞自然發揮

### 3. 返回結果
```json
{
  "reply": "你怎麼現在才問呀～想知道的話可得先說句好聽的～",
  "tags": ["playful", "teasing", "confident"],
  "toneTag": { "emoji": "🎀", "label": "俏皮" },
  "routingType": "pool",
  "history": [...]
}
```

---

## 🧪 測試建議

### 單元測試用例

| 使用者輸入 | 預期 persona | 語氣反應類型 | 預期 tags |
| ---------- | ------------ | ------------ | --------- |
| 你是誰？ | 黃蓉 | 撩人 + 試探 | `["playful", "teasing", "confident"]` |
| 可以介紹一下自己嗎？ | 黃蓉 | 套話 + 避實就虛 | `["playful", "smart", "teasing"]` |
| 告訴我你從哪來 | 黃蓉 | 詭譎 + 神秘 | `["playful", "teasing", "confident"]` |

### 測試方法

1. **本地測試**：
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"text": "你是誰？"}'
   ```

2. **檢查日誌**：
   - 應該看到 `🎯 Prompt Routing 匹配: "你是誰？" → 黃蓉`
   - 應該看到 `🎯 使用 Prompt Routing 回應（黃蓉）`

3. **驗證回應**：
   - 回應應該來自 `responsePool`，不應該包含禁止語句
   - `routingType` 應該是 `"pool"`

---

## 🔧 擴展指南

### 添加新的路由規則

在 `modules/prompt-routing.js` 中的 `promptRoutingRules` 數組添加：

```javascript
{
  trigger: /(你的興趣|你喜歡什麼|你的愛好)/i,
  persona: "黃蓉",
  responsePool: [
    "興趣？我倒是對聰明的人特別感興趣呢～",
    "我喜歡的東西可多了，不過最喜歡的還是...你猜猜看？",
  ],
  fallback: "你這麼問，是想了解我還是想討好我呀？",
  voiceConfig: {
    tags: ["playful", "teasing"],
    pitch: 1.1,
    rate: 1.05,
  },
}
```

### 添加新的禁止語句

在 `forbiddenPhrases` 數組中添加：

```javascript
export const forbiddenPhrases = [
  // ... 現有語句
  "我是AI助手",
  "我是一個程序",
];
```

---

## 📊 調試信息

系統會在控制台輸出以下調試信息：

- `🎯 Prompt Routing 匹配: "..." → 黃蓉`
- `   使用 responsePool (N 條)`
- `🎯 使用 Prompt Routing 回應（黃蓉）`
- `⚠️ 檢測到禁止語句: "..."`
- `⚠️ 回應包含禁止語句，使用 fallback`

---

## ✅ 完成狀態

- [x] ✅ 匯入黃蓉 `.mdc` 模組（system-prompt.txt）
- [x] ✅ 建立 `promptRoutingRules` 對應表
- [x] ✅ 將 responsePool 分成多類語氣（撩人／試探／謎語）
- [x] ✅ 串接 Cartesia 並注入聲線參數
- [x] ✅ 設立 `forbiddenPhrases` 避免 LLM fallback 誤講
- [x] ✅ 設置 debug log，每次回應記錄 `persona`, `trigger`, `response_type`

---

## 🎉 結果

現在黃蓉會：
- 在遇到「你是誰？」等問題時，使用預定義的俏皮回應
- 避免「我是黃蓉，來自桃花島」等模板回答
- 自動應用對應的語音風格（playful, teasing, confident）
- 保持黃蓉本靈的語氣特色（撩中帶謎，笑中藏刃）


