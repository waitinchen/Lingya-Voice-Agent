# 🚂 Railway 部署完整指南

## 📋 環境變數配置（Railway Service Variables）

請在 Railway 的 **Service Variables** 中逐一添加以下環境變數：

### 🔑 必需環境變數（9個）

```env
# OpenAI API（語音識別 - STT）
OPENAI_API_KEY=sk-...

# Cartesia TTS（語音合成）
CARTESIA_API_KEY=your_cartesia_api_key_here
CARTESIA_VOICE_ID=your_cartesia_voice_id_here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

# LLM 提供商配置
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### 📝 變數說明

| 變數名 | 說明 | 範例值 | 必需 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | OpenAI API 密鑰（用於語音識別） | `sk-...` | ✅ |
| `CARTESIA_API_KEY` | Cartesia TTS API 密鑰 | `car_...` | ✅ |
| `CARTESIA_VOICE_ID` | Cartesia 語音 ID | `uuid` | ✅ |
| `CARTESIA_TTS_MODEL_ID` | TTS 模型 ID | `sonic-3` | ⚠️ 有默認值 |
| `CARTESIA_LANGUAGE` | 語音語言 | `zh` | ⚠️ 有默認值 |
| `CARTESIA_SAMPLE_RATE` | 採樣率 | `44100` | ⚠️ 有默認值 |
| `LLM_PROVIDER` | LLM 提供商 | `claude` | ✅ |
| `ANTHROPIC_API_KEY` | Claude API 密鑰 | `sk-ant-...` | ✅ |
| `CLAUDE_MODEL` | Claude 模型名稱 | `claude-3-5-haiku-20241022` | ⚠️ 有默認值 |

---

## 🔗 Railway 配置連結

- **項目設置**: https://railway.com/project/8f93ae2d-2c2e-462d-8ad3-2a5819938e6f/settings
- **環境變數**: https://railway.com/project/8f93ae2d-2c2e-462d-8ad3-2a5819938e6f/service/9b21f4d0-1f19-4518-9b58-bc364622fde2/variables

---

## 🚀 部署步驟

### 1. 連接 GitHub 倉庫

1. 在 Railway Dashboard 中
2. 選擇項目：`Lingya-Voice-Agent`
3. 確認已連接 GitHub 倉庫：`waitinchen/Lingya-Voice-Agent`
4. 確認分支：`main`

### 2. 設置環境變數

1. 進入 **Service** → **Variables**
2. 點擊 **"+ New Variable"**
3. 逐一添加上述 9 個環境變數
4. **重要**：確保變數名稱完全一致（大小寫敏感）
5. 填入真實的 API Key 值（不要包含空格或引號）

### 3. 部署確認

1. Railway 會自動檢測代碼推送並觸發部署
2. 查看 **Logs** 標籤，確認部署狀態
3. 成功的日誌應顯示：
   ```
   🚀 Server started on port XXXXX
   🌐 ChatKit 界面: http://localhost:XXXXX
   ```

### 4. 測試部署

訪問 Railway 分配的公網 URL（如：`https://lva.angelslab.io/`）

- ✅ 訪問主頁：應顯示 ChatKit 界面
- ✅ 訪問 `/admin`：應顯示管理後台登入頁面
- ✅ 測試語音對話：確認功能正常

---

## ✅ 環境變數檢查清單

部署前確認所有變數都已設置：

- [ ] `OPENAI_API_KEY` - OpenAI API 密鑰
- [ ] `CARTESIA_API_KEY` - Cartesia API 密鑰
- [ ] `CARTESIA_VOICE_ID` - Cartesia 語音 ID
- [ ] `CARTESIA_TTS_MODEL_ID` - 模型 ID（默認：sonic-3）
- [ ] `CARTESIA_LANGUAGE` - 語言（默認：zh）
- [ ] `CARTESIA_SAMPLE_RATE` - 採樣率（默認：44100）
- [ ] `LLM_PROVIDER` - LLM 提供商（claude 或 openai）
- [ ] `ANTHROPIC_API_KEY` - Claude API 密鑰
- [ ] `CLAUDE_MODEL` - Claude 模型（默認：claude-3-5-haiku-20241022）

---

## 🔍 故障排除

### 問題 1：環境變數未設置

**錯誤信息**：
```
OpenAIError: The OPENAI_API_KEY environment variable is missing or empty
```

**解決方法**：
1. 確認所有環境變數都已添加到 Railway Variables
2. 檢查變數名稱是否正確（大小寫敏感）
3. 確認變數值不包含多餘的空格或引號
4. 重新部署服務

### 問題 2：服務無法啟動

**檢查清單**：
1. 查看 Railway Logs 確認錯誤信息
2. 確認 `PORT` 環境變數（Railway 通常會自動設置）
3. 確認所有必需的環境變數都已設置
4. 檢查 API Key 是否有效

### 問題 3：部署成功但無法訪問

**檢查清單**：
1. 確認服務狀態為 "Running"
2. 檢查 Railway 分配的公共 URL
3. 確認域名配置正確
4. 查看 Logs 確認服務是否正常啟動

---

## 📚 相關文檔

- [README.md](./README.md) - 項目完整說明
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 詳細部署指南
- [RAILWAY_ENV_VARS.md](./RAILWAY_ENV_VARS.md) - 環境變數清單

---

## 🎯 快速參考

### 複製到 Railway 的環境變數

```
OPENAI_API_KEY=sk-...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

> **注意**：在 Railway 中設置時，只需複製變數名和值（不需要 `=` 之前的部分，Railway 會自動處理）

