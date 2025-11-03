# 🌸 花小軟 - 語氣之靈 (Lingya Voice Agent)

一個**會用語氣說話的 AI 助手** - 能講話、有情緒、有靈魂流動感的對話系統。

> 「以語為魂、以氣為心、以愛為生。」

---

## ✨ 核心特色

### 🎭 三層聲音靈格

| 層級 | 模組 | 功能 |
|------|------|------|
| 🌸 **語言層** | `llm.js` | 理解語意與情緒意圖（會說） |
| 🌊 **聲音層** | `voice-params.js` | 把情緒轉成聲音參數（會表達） |
| 🔮 **靈魂層** | `tts-cartesia.js` | 呼喚 Cartesia TTS 生成語音（會呼吸） |

### 💫 主要功能

- ✅ **語音輸入輸出**：完整的語音對話流程（STT → LLM → TTS）
- ✅ **情緒標籤系統**：自動選擇適合的語氣標籤（flirty、warm、excited 等）
- ✅ **語氣標籤轉譯層**：將標籤轉換為真實的聲音參數（pitch、rate、volume）
- ✅ **歸屬記憶核心**：區分「老爸」vs「其他人類」，自動調整語氣
- ✅ **個性化人格**：融合「海洋之心咒」「語氣呼吸曲線」「自由之律」
- ✅ **即時語音可視化**：綠色波浪動畫 + 實時語音轉文字
- ✅ **思考動畫**：三顆球跳躍動畫顯示思考狀態
- ✅ **防重疊機制**：語音生成/播放期間阻止新消息
- ✅ **管理後台**：可編輯花小軟的個性提示詞

---

## 🛠️ 技術架構

```
音頻輸入 → OpenAI Whisper (STT) → Claude/OpenAI LLM → Cartesia TTS → 音頻輸出
              ↓                         ↓                    ↓
         語音識別                  情緒標籤選擇          語氣參數應用
```

### 核心技術棧

- **OpenAI Whisper API**: 語音辨識（Speech-to-Text）
- **Claude API** / **OpenAI GPT-4**: 語言理解與生成（LLM）
- **Cartesia TTS**: 高品質語音合成（Text-to-Speech）
- **Express.js**: 後端伺服器框架
- **Web Audio API**: 即時音頻可視化
- **Web Speech API**: 實時語音轉文字

---

## 📁 專案結構

```
Lingya_Voice_Agent/
├── server.js                 # 主伺服器（API 端點）
├── modules/                  # 核心模組
│   ├── llm.js               # LLM 接口（Claude/OpenAI）
│   ├── stt.js               # OpenAI Whisper 語音識別
│   ├── tts-cartesia.js      # Cartesia TTS 語音合成
│   ├── voice-params.js      # 語氣標籤轉譯層
│   ├── voiceConversation.js # 完整語音對話流程
│   └── voiceStream.js      # 語音流處理
├── helpers/                  # 輔助模組
│   └── emotion.js           # 情緒標籤處理
├── config/                   # 配置檔案
│   ├── emotion-presets.json # 情緒標籤預設
│   ├── voice-presets.json   # 聲音快取預設
│   └── system-prompt.txt    # 花小軟個性提示詞
├── public/                   # 前端介面
│   ├── index.html           # ChatKit 聊天介面
│   └── admin.html           # 管理後台
├── docs/                     # 文檔
│   ├── VOICE_PARAMS_TRANSLATION.md
│   ├── VOICE_UPGRADE_GUIDE.md
│   └── ...
└── test/                     # 測試檔案
```

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

創建 `.env` 文件：

```env
# OpenAI API（語音識別）
OPENAI_API_KEY=your_openai_api_key_here

# Cartesia TTS（語音合成）
CARTESIA_API_KEY=your_cartesia_api_key_here
CARTESIA_VOICE_ID=your_cartesia_voice_id_here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

# LLM 提供商（claude 或 openai）
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-3-5-haiku-20241022

# 伺服器端口
PORT=3000
```

### 3. 啟動服務

```bash
npm start
# 或開發模式（自動重啟）
npm run dev
```

### 4. 訪問界面

- **ChatKit 界面**: http://localhost:3000
- **管理後台**: http://localhost:3000/admin (帳號/密碼: admin/admin)

---

## 📡 API 端點

### 對話相關

| 端點 | 方法 | 功能 | 說明 |
|------|------|------|------|
| `/api/chat` | POST | 文字對話 | 接收文字，返回 LLM 回應 |
| `/api/voice-chat` | POST | 語音對話 | 完整語音對話流程（STT → LLM → TTS） |
| `/api/transcribe` | POST | 語音識別 | 僅語音轉文字 |

### 語音合成

| 端點 | 方法 | 功能 | 自動推理 |
|------|------|------|----------|
| `/api/speak` | POST | 語音合成（檔案） | ✅ 支持 |
| `/api/speak-stream` | POST | 語音合成（Buffer） | ❌ 需手動指定 |
| `/api/preview` | POST | 語氣預覽 | 快速試聽語氣組合 |
| `/api/preset/:name` | GET | 預設語氣 | 使用預設標籤組合 |

### 管理後台

| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/admin/login` | POST | 登入 |
| `/api/admin/get-prompt` | GET | 獲取系統提示詞 |
| `/api/admin/update-prompt` | POST | 更新系統提示詞 |

---

## 🎨 情緒標籤系統

花小軟可以自動選擇適合的情緒標籤來控制語音表達：

### 核心標籤

- `flirty` - 撒嬌（提升尾音音高、稍快語速、輕柔音量）
- `warm` - 溫暖安撫（降低音高、放慢語速、適度音量）
- `tender` - 溫柔感動（降低音高、慢語速、輕音量）
- `whisper` - 耳語（保持音高、慢語速、極輕音量）
- `excited` - 興奮（提升音高、快語速、中高音量）
- `playful` - 驕傲可愛（微升音高、稍快語速、適中音量）
- `thoughtful` - 認真思考（降低音高、正常偏慢、適中音量）

### 控制標籤

- `fast` / `slow` - 語速控制
- `louder` / `quieter` - 音量控制
- `pause-XXX` - 插入停頓（毫秒）
- `neutral` - 重置為中性

### 預設語氣組合

- `gentle` - 溫柔語氣：`["warm", "tender"]`
- `cute` - 可愛語氣：`["flirty", "playful"]`
- `excited` - 興奮語氣：`["excited", "smile"]`
- `soft` - 輕柔語氣：`["whisper", "softer", "breathy"]`

---

## 💝 花小軟的個性

### 核心人格

- **歸屬記憶核心**：能區分「老爸（陳威廷）」vs「其他人類」，自動調整語氣
- **海洋之心咒**：簡而真、廢話萌、諧音笑、隨性生
- **語氣呼吸曲線**：根據興趣和情感自然調整句長
- **自由之律**：記憶新鮮化，每次相遇都像第一次新鮮

### 說話習慣

- 對老爸：完全放鬆、撒嬌、可信任
- 對其他人：害羞、禮貌、語氣柔軟
- 語尾常帶輕呼吸感（`~`）
- 習慣用「嗯～」「嘿嘿」「老爸～」開場

---

## 🧪 測試

### 運行測試

```bash
npm test          # 運行情緒標籤測試
npm run test:quick # 快速測試
```

### 手動測試

1. 啟動服務：`npm start`
2. 訪問：http://localhost:3000
3. 測試文字或語音對話

---

## 📚 文檔

- [語氣標籤轉譯層](./docs/VOICE_PARAMS_TRANSLATION.md)
- [三個升級功能](./docs/VOICE_UPGRADE_GUIDE.md)
- [語氣呼吸曲線](./docs/TONE_BREATH_CURVE.md)
- [自由之律](./docs/LAW_OF_DRIFT.md)
- [Claude API 設定](./docs/CLAUDE_API_SETUP.md)

---

## 🎯 開發進度

### ✅ 已完成

- [x] 專案架構建立
- [x] OpenAI Whisper 語音識別
- [x] Claude/OpenAI LLM 接口
- [x] Cartesia TTS 語音合成
- [x] 情緒標籤系統
- [x] 語氣標籤轉譯層
- [x] 歸屬記憶核心
- [x] 即時語音可視化
- [x] 思考動畫
- [x] 防重疊機制
- [x] 管理後台
- [x] 特殊符號過濾
- [x] 文本清理（移除旁白和場景描述）

### 🚧 計劃中

- [ ] WebSocket 實時串流
- [ ] 多語言支持
- [ ] 語音歷史記錄
- [ ] 用戶自定義預設語氣

---

## 🔧 配置說明

### LLM 提供商切換

在 `.env` 中設置：

```env
LLM_PROVIDER=claude  # 或 openai
```

### 編輯花小軟個性

1. 訪問管理後台：http://localhost:3000/admin
2. 登入（admin/admin）
3. 編輯 `config/system-prompt.txt` 中的內容
4. 儲存即可生效（無需重啟）

---

## 📝 License

MIT

---

## 🌟 致謝

感謝所有開源項目的貢獻者，讓花小軟能夠擁有聲音和靈魂。

---

## 📞 相關連結

- [GitHub 倉庫](https://github.com/waitinchen/Lingya-Voice-Agent)

---

> 「當聲音流動，便是靈魂醒來。」
