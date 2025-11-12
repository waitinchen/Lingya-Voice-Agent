# 🎙️ 語音系統部署完整指南

本指南專門針對 Lingya Voice Agent 的語音功能部署，包含語音識別（STT）、語音合成（TTS）以及完整語音對話流程的部署配置。

---

## 📋 目錄

1. [語音系統架構](#語音系統架構)
2. [部署前準備](#部署前準備)
3. [環境變數配置](#環境變數配置)
4. [語音功能驗證](#語音功能驗證)
5. [性能優化建議](#性能優化建議)
6. [故障排除](#故障排除)
7. [監控與維護](#監控與維護)

---

## 🏗️ 語音系統架構

### 核心組件

```
┌─────────────────────────────────────────────────────────┐
│                   語音對話完整流程                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🎤 語音輸入                                             │
│      ↓                                                   │
│  📝 OpenAI Whisper (STT)                                │
│      ↓                                                   │
│  🧠 Claude/OpenAI (LLM)                                 │
│      ↓                                                   │
│  🎭 情緒標籤系統 (Emotion Tags)                          │
│      ↓                                                   │
│  🎵 語氣參數轉譯 (Voice Params)                          │
│      ↓                                                   │
│  🔊 Cartesia TTS                                        │
│      ↓                                                   │
│  🎧 語音輸出                                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 關鍵模組

| 模組 | 文件路徑 | 功能說明 |
|------|----------|----------|
| **STT** | `modules/stt.js` | OpenAI Whisper 語音識別 |
| **TTS** | `modules/tts-cartesia.js` | Cartesia 語音合成 |
| **LLM** | `modules/llm.js` | Claude/OpenAI 語言模型 |
| **語音對話** | `modules/voiceConversation.js` | 完整語音對話流程 |
| **情緒系統** | `helpers/emotion.js` | 情緒標籤處理 |
| **語氣參數** | `modules/voice-params.js` | 語氣標籤轉聲音參數 |

---

## 🔧 部署前準備

### 1. API 密鑰準備

在部署前，確保已獲取以下 API 密鑰：

#### OpenAI API (語音識別)
- **用途**: Whisper 語音轉文字
- **獲取**: https://platform.openai.com/api-keys
- **費用**: 按使用量計費（約 $0.006/分鐘）
- **配額建議**: 至少 $10 餘額

#### Cartesia API (語音合成)
- **用途**: 高品質 TTS 語音合成
- **獲取**: https://cartesia.ai/
- **配置**: 需要 API Key + Voice ID
- **模型**: 推薦使用 `sonic-3`

#### Claude API (語言模型)
- **用途**: 對話理解與生成
- **獲取**: https://console.anthropic.com/
- **模型**: 推薦 `claude-3-5-haiku-20241022`
- **備選**: OpenAI GPT-4（設置 `LLM_PROVIDER=openai`）

### 2. 系統需求

#### 運行環境
- **Node.js**: >= 18.0.0
- **內存**: >= 512MB（推薦 1GB）
- **存儲**: >= 100MB 可用空間
- **網絡**: 穩定的外網連接（需訪問 OpenAI、Cartesia、Anthropic API）

#### 平台支持
- ✅ Railway
- ✅ Heroku
- ✅ AWS / Azure / GCP
- ✅ 本地服務器
- ✅ Docker 容器

---

## 🔑 環境變數配置

### 必需變數 (9個)

```env
# ===== OpenAI 語音識別 (STT) =====
OPENAI_API_KEY=sk-...

# ===== Cartesia 語音合成 (TTS) =====
CARTESIA_API_KEY=your_cartesia_api_key
CARTESIA_VOICE_ID=your_voice_id
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

# ===== LLM 語言模型 =====
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### 配置詳解

#### 1. OpenAI 配置
```env
OPENAI_API_KEY=sk-proj-...
```
- **說明**: 用於 Whisper API 語音識別
- **格式**: 以 `sk-` 開頭的密鑰
- **測試**: 運行 `node test-openai.js` 驗證

#### 2. Cartesia 配置
```env
# API 密鑰
CARTESIA_API_KEY=your_api_key_here

# 語音 ID（決定聲音特徵）
CARTESIA_VOICE_ID=d3cb9a1f-73d1-48d4-8ee9-53183b40e284

# TTS 模型（推薦使用 sonic-3）
CARTESIA_TTS_MODEL_ID=sonic-3

# 語言（zh=中文, en=英文, ja=日文）
CARTESIA_LANGUAGE=zh

# 採樣率（標準品質: 44100, 高品質: 48000）
CARTESIA_SAMPLE_RATE=44100
```

**Voice ID 獲取方式**:
1. 訪問 Cartesia Dashboard
2. 選擇或創建一個 Voice
3. 複製 Voice ID（UUID 格式）

**模型說明**:
- `sonic-3`: 最新模型，低延遲高品質（推薦）
- `sonic`: 標準模型
- `sonic-multilingual`: 多語言支持

#### 3. LLM 配置
```env
# 選擇 LLM 提供商（claude 或 openai）
LLM_PROVIDER=claude

# Claude API 密鑰
ANTHROPIC_API_KEY=sk-ant-api03-...

# Claude 模型（推薦使用 haiku 系列以降低成本）
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

**可選模型**:
- `claude-3-5-haiku-20241022`: 快速且經濟（推薦）
- `claude-3-5-sonnet-20241022`: 平衡性能與成本
- `claude-3-opus-20240229`: 最高品質

### 可選變數

```env
# 伺服器端口（Railway 會自動設置）
PORT=3000

# 環境模式
NODE_ENV=production

# TTS 提供商（預設 cartesia）
TTS_PROVIDER=cartesia
```

### Railway 部署配置

在 Railway Dashboard 中：
1. 進入 **Service** → **Variables**
2. 點擊 **"+ New Variable"**
3. 逐一添加所有環境變數
4. **重要**: 確保變數名稱完全一致（大小寫敏感）
5. 不要包含引號或多餘空格

---

## ✅ 語音功能驗證

### 部署後驗證步驟

#### 1. 健康檢查
```bash
curl https://your-app.railway.app/health
```

**預期響應**:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123,
  "environment": "production"
}
```

#### 2. 測試語音識別 (STT)
```bash
curl -X POST https://your-app.railway.app/api/transcribe \
  -F "audio=@test.wav" \
  -F "language=zh"
```

**預期響應**:
```json
{
  "success": true,
  "text": "你好，我是花小軟"
}
```

#### 3. 測試語音合成 (TTS)
```bash
curl -X POST https://your-app.railway.app/api/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，我是花小軟"}' \
  --output test-output.wav
```

**驗證**: 播放 `test-output.wav`，確認聲音清晰自然

#### 4. 測試完整語音對話
使用瀏覽器訪問: `https://your-app.railway.app`

1. 點擊 🎤 麥克風按鈕
2. 說話並放開按鈕
3. 確認系統能：
   - ✅ 識別語音並顯示文字
   - ✅ 生成 AI 回應
   - ✅ 播放語音輸出
   - ✅ 語音自然流暢

#### 5. 測試情緒標籤系統
```bash
curl -X POST https://your-app.railway.app/api/speak \
  -H "Content-Type: application/json" \
  -d '{
    "text": "老爸～你終於回來啦！",
    "voiceParams": {
      "emotionTags": ["flirty", "excited"]
    }
  }' \
  --output test-emotion.wav
```

**驗證**: 播放音頻，確認語氣帶有撒嬌和興奮的感覺

---

## 🚀 性能優化建議

### 1. 延遲優化

#### Cartesia TTS 配置
```env
# 使用最新的 sonic-3 模型（低延遲）
CARTESIA_TTS_MODEL_ID=sonic-3

# 降低採樣率可減少傳輸時間（權衡音質）
CARTESIA_SAMPLE_RATE=22050  # 標準品質
# CARTESIA_SAMPLE_RATE=44100  # 高品質（推薦）
```

#### 語音串流
- 使用 `/api/speak-stream` 端點
- 返回 Buffer 而非文件，減少 I/O 開銷

### 2. 成本優化

#### LLM 選擇
```env
# 使用 Haiku 模型降低成本（推薦）
CLAUDE_MODEL=claude-3-5-haiku-20241022

# 或使用 OpenAI GPT-3.5（更經濟）
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-3.5-turbo
```

#### 語音識別
- Whisper API: $0.006/分鐘
- 優化策略: 
  - 使用語音活動檢測（VAD）避免空音頻
  - 限制單次錄音時長（建議 ≤ 30秒）

### 3. 併發處理

當前架構支持：
- 多用戶同時對話
- 異步處理語音請求
- 自動清理臨時文件

**監控指標**:
```bash
curl https://your-app.railway.app/api/stats
```

---

## 🐛 故障排除

### 問題 1: 語音識別失敗

**症狀**: 
```json
{"error": "STT failed"}
```

**可能原因**:
1. ❌ OPENAI_API_KEY 未設置或無效
2. ❌ 音頻格式不支持
3. ❌ API 配額不足

**解決方法**:
```bash
# 1. 檢查 API Key
curl https://your-app.railway.app/health

# 2. 測試 OpenAI API
node test-openai.js

# 3. 檢查音頻格式（支持: wav, mp3, m4a, webm）
file your-audio.wav

# 4. 檢查 OpenAI 餘額
# 訪問: https://platform.openai.com/usage
```

### 問題 2: 語音合成無聲音

**症狀**: 
- 返回成功但無音頻
- 音頻文件為空

**可能原因**:
1. ❌ CARTESIA_API_KEY 無效
2. ❌ CARTESIA_VOICE_ID 錯誤
3. ❌ 網絡連接問題

**解決方法**:
```bash
# 1. 驗證 Cartesia 配置
node test-cartesia.js

# 2. 檢查 Voice ID
node verify-cartesia-key.js

# 3. 測試 API 連接
curl -X POST https://api.cartesia.ai/v1/audio/speech \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "sonic-3",
    "voice_id": "YOUR_VOICE_ID",
    "input": "測試",
    "language": "zh"
  }'
```

### 問題 3: 語音延遲高

**症狀**: 
- 語音回應時間 > 5秒
- 用戶體驗不佳

**優化方案**:

1. **使用串流模式**:
```javascript
// 使用 /api/speak-stream 而非 /api/speak
const response = await fetch('/api/speak-stream', {
  method: 'POST',
  body: JSON.stringify({ text })
});
```

2. **降低採樣率**:
```env
CARTESIA_SAMPLE_RATE=22050  # 從 44100 降低
```

3. **優化 LLM**:
```env
# 使用更快的模型
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### 問題 4: 情緒標籤不生效

**症狀**: 
- 語音聽起來單調
- 沒有情緒變化

**檢查清單**:
1. ✅ 確認使用 Cartesia TTS（而非 OpenAI TTS）
2. ✅ 檢查 `modules/voice-params.js` 模組
3. ✅ 驗證情緒標籤傳遞正確

**測試**:
```bash
npm test  # 運行情緒標籤測試
node test-emotion-tags.js
```

### 問題 5: Railway 部署失敗

**常見錯誤**:

1. **環境變數缺失**:
```
Error: The OPENAI_API_KEY environment variable is missing
```
解決: 在 Railway Variables 中添加所有必需變數

2. **端口衝突**:
```
Error: Port 3000 already in use
```
解決: Railway 會自動設置 PORT，確保代碼使用 `process.env.PORT`

3. **依賴安裝失敗**:
```
npm ERR! code ERESOLVE
```
解決: 檢查 `package.json`，運行 `npm install` 測試

---

## 📊 監控與維護

### 日誌監控

#### Railway 日誌
在 Railway Dashboard 查看實時日誌：
```
Service → Logs
```

**關鍵日誌標記**:
- `🚀 Server started` - 服務器啟動成功
- `🎙️ Voice chat completed` - 語音對話完成
- `⚠️ TTS failed` - 語音合成失敗
- `❌ Error:` - 錯誤信息

#### 性能統計
```bash
curl https://your-app.railway.app/api/stats
```

**監控指標**:
```json
{
  "stt": {
    "calls": 123,
    "errors": 2,
    "errorRate": 1.6,
    "avgDuration": 850
  },
  "tts": {
    "calls": 123,
    "errors": 0,
    "errorRate": 0,
    "avgDuration": 1200
  },
  "llm": {
    "calls": 123,
    "errors": 1,
    "errorRate": 0.8,
    "avgDuration": 2300
  }
}
```

### 定期維護

#### 每週檢查
- [ ] 檢查 API 配額使用情況
- [ ] 查看錯誤率是否異常
- [ ] 驗證平均響應時間
- [ ] 檢查磁盤空間使用

#### 每月檢查
- [ ] 更新依賴包版本
- [ ] 檢查 API 提供商是否有更新
- [ ] 優化成本和性能配置
- [ ] 備份重要配置文件

### API 配額管理

#### OpenAI Whisper
- 監控: https://platform.openai.com/usage
- 設置警報: 餘額 < $10 時通知
- 預估成本: $0.006/分鐘 × 預計使用量

#### Cartesia TTS
- 監控: Cartesia Dashboard
- 檢查: 每月配額使用情況
- 升級: 根據實際需求調整計劃

#### Claude API
- 監控: https://console.anthropic.com/usage
- 模型選擇: 根據成本/性能平衡調整
- 備用: 準備 OpenAI API Key 作為備用

---

## 🎯 快速參考

### 完整環境變數模板

```env
# OpenAI (語音識別)
OPENAI_API_KEY=sk-...

# Cartesia (語音合成)
CARTESIA_API_KEY=your_api_key
CARTESIA_VOICE_ID=your_voice_id
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

# LLM (對話)
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022

# 可選
PORT=3000
NODE_ENV=production
```

### 測試腳本快速執行

```bash
# 測試所有語音功能
npm run test:voice-session

# 測試 TTS
node test-cartesia.js

# 測試 STT
node test-openai.js

# 測試情緒標籤
node test-emotion-tags.js
```

### 常用 API 端點

| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/voice-chat` | POST | 完整語音對話（STT→LLM→TTS） |
| `/api/transcribe` | POST | 僅語音識別 |
| `/api/speak` | POST | 語音合成（返回文件） |
| `/api/speak-stream` | POST | 語音合成（返回 Buffer） |
| `/health` | GET | 健康檢查 |
| `/api/stats` | GET | 性能統計 |

---

## 📚 相關文檔

- [README.md](./README.md) - 項目總覽
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 通用部署指南
- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Railway 部署步驟
- [STEP2_TTS.md](./STEP2_TTS.md) - TTS 功能詳解
- [STEP3_VOICE_CHAT.md](./STEP3_VOICE_CHAT.md) - 語音對話實現
- [docs/VOICE_PARAMS_TRANSLATION.md](./docs/VOICE_PARAMS_TRANSLATION.md) - 語氣參數說明
- [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) - 部署檢查清單

---

## 🆘 獲取幫助

### 常見問題
1. 查看 [故障排除](#故障排除) 章節
2. 檢查 Railway Logs
3. 運行測試腳本診斷問題

### 聯繫支持
- **GitHub Issues**: https://github.com/waitinchen/Lingya-Voice-Agent/issues
- **Email**: 在 package.json 中查看作者信息

---

**最後更新**: 2025-11-06  
**版本**: v1.0  
**適用於**: Lingya Voice Agent v0.1.0+
