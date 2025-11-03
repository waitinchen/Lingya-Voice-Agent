# 🚂 Railway 環境變數配置清單

## 📋 必需環境變數

請在 Railway 的 **Service Variables** 中配置以下環境變數：

### OpenAI API（語音識別）

```
OPENAI_API_KEY=sk-...
```

### Cartesia TTS（語音合成）

```
CARTESIA_API_KEY=your_cartesia_api_key_here
CARTESIA_VOICE_ID=your_cartesia_voice_id_here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100
```

### LLM 提供商（Claude）

```
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### 可選環境變數

```
PORT=3000
```

> 注意：Railway 通常會自動設置 `PORT`，如果未設置，默認使用 3000。

---

## 🔗 Railway 配置連結

- **項目設置**: https://railway.com/project/8f93ae2d-2c2e-462d-8ad3-2a5819938e6f/settings
- **環境變數**: https://railway.com/project/8f93ae2d-2c2e-462d-8ad3-2a5819938e6f/service/9b21f4d0-1f19-4518-9b58-bc364622fde2/variables

---

## ✅ 檢查清單

部署前確認：

- [ ] `OPENAI_API_KEY` 已設置
- [ ] `CARTESIA_API_KEY` 已設置
- [ ] `CARTESIA_VOICE_ID` 已設置
- [ ] `CARTESIA_TTS_MODEL_ID` 已設置（或使用默認值 `sonic-3`）
- [ ] `CARTESIA_LANGUAGE` 已設置（或使用默認值 `zh`）
- [ ] `CARTESIA_SAMPLE_RATE` 已設置（或使用默認值 `44100`）
- [ ] `LLM_PROVIDER` 已設置（`claude` 或 `openai`）
- [ ] `ANTHROPIC_API_KEY` 已設置（如果使用 Claude）
- [ ] `CLAUDE_MODEL` 已設置（如果使用 Claude）

---

## 🚀 部署步驟

1. **連接 GitHub 倉庫**
   - 在 Railway 中創建新項目或選擇現有項目
   - 連接 `waitinchen/Lingya-Voice-Agent` 倉庫
   - 選擇 `main` 分支

2. **設置環境變數**
   - 進入 Service → Variables
   - 逐一添加上述環境變數
   - 確保所有值都正確無誤

3. **部署**
   - Railway 會自動檢測代碼推送並部署
   - 查看 Logs 確認部署狀態

4. **測試**
   - 訪問 Railway 分配的公網 URL
   - 測試 ChatKit 界面和管理後台

