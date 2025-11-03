# Lingya Voice Agent 🌸

一個**會用語氣說話的 AI 助手** - 能講話、有情緒、有靈魂流動感的對話系統。

## 專案目標

打造一個 MVP（最小可行產品），讓 AI 能夠：
- ✅ 用自然的語氣講話
- ✅ 即時回應
- ✅ 根據情緒調整 tone

## 技術架構

```
音頻輸入 → Whisper (STT) → LLM (理解+生成) → XTTS (TTS) → 音頻輸出
```

### 核心技術

- **Faster-Whisper**: 語音辨識（Speech-to-Text）
- **Ollama / 雲端 LLM**: 語言理解與生成
- **Coqui XTTS-v2**: 語音合成（Text-to-Speech）
- **WebRTC / Vocode**: 即時串流

## 專案結構

```
lingya-voice-agent/
├── server.js              # 主伺服器
├── config/                # 配置管理
│   └── config.js
├── modules/               # 功能模組
│   ├── whisper.js        # Faster-Whisper 語音識別
│   ├── llm.js            # LLM 接口（Ollama/雲端）
│   ├── tts.js            # Coqui XTTS-v2 語音合成
│   └── voiceStream.js    # 即時語音流處理
└── utils/                # 工具函數
    └── helpers.js
```

## 安裝與啟動

1. 安裝依賴：
```bash
npm install
```

2. 設定環境變數（複製 `.env.example` 並填入）：
```bash
cp .env.example .env
```

3. 啟動服務：
```bash
npm start
# 或開發模式（自動重啟）
npm run dev
```

## 環境變數

見 `.env.example` 文件。

## 開發階段

- [x] 專案架構建立
- [ ] 語音識別模組
- [ ] LLM 接口模組
- [ ] 語音合成模組
- [ ] 即時串流整合
- [ ] 情緒調整機制
- [ ] Supabase 整合（情緒記憶）
- [ ] n8n 整合（自動修正）

## License

MIT

