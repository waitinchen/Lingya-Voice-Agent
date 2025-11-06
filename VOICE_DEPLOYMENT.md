# 🎙️ 語音功能部署完整指南

> 花小軟語音系統部署流程 - 從 API 申請到完整部署

---

## 📋 目錄

1. [語音功能概覽](#語音功能概覽)
2. [前置準備：API Key 申請](#前置準備api-key-申請)
3. [環境變數配置](#環境變數配置)
4. [本地開發環境設置](#本地開發環境設置)
5. [Railway 雲端部署](#railway-雲端部署)
6. [語音功能驗證](#語音功能驗證)
7. [常見問題排除](#常見問題排除)
8. [API 使用成本參考](#api-使用成本參考)

---

## 🎯 語音功能概覽

花小軟的語音系統包含三個核心組件：

### 完整語音對話流程

```
🎤 語音輸入 → 🧠 Whisper STT → 💬 Claude/OpenAI LLM → 🔊 Cartesia TTS → 🎵 語音輸出
```

### 技術組件

| 組件 | 服務提供商 | 功能 | 必需 |
|------|-----------|------|------|
| **STT (語音識別)** | OpenAI Whisper | 將語音轉換為文字 | ✅ 必需 |
| **LLM (語言理解)** | Claude/OpenAI | 理解並生成回應 | ✅ 必需 |
| **TTS (語音合成)** | Cartesia | 將文字轉換為語音 | ✅ 必需 |

---

## 🔑 前置準備：API Key 申請

### 1. OpenAI API Key（語音識別）

**用途**：Whisper 語音轉文字（STT）

**申請步驟**：

1. 訪問 [OpenAI Platform](https://platform.openai.com/)
2. 註冊/登入帳號
3. 進入 **API Keys** 頁面
4. 點擊 **Create new secret key**
5. 複製並保存 API Key（格式：`sk-...`）
6. **重要**：添加付費方式（Billing）才能使用 API

**費用參考**：
- Whisper API：$0.006 / 分鐘
- 示例：100 分鐘語音 ≈ $0.60

**驗證 API Key**：
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY"
```

### 2. Cartesia API Key（語音合成）

**用途**：Cartesia TTS 文字轉語音

**申請步驟**：

1. 訪問 [Cartesia](https://cartesia.ai/)
2. 註冊帳號
3. 進入 **API Keys** 或 **Dashboard**
4. 創建新的 API Key
5. 複製並保存（格式：`car_...` 或類似）

**獲取 Voice ID**：
1. 在 Cartesia Dashboard 中選擇或創建語音
2. 複製 Voice ID（通常是 UUID 格式）
3. 或使用預設語音 ID

**費用參考**：
- Sonic 模型：約 $0.01 - $0.05 per 1K characters
- 查看最新定價：[Cartesia Pricing](https://cartesia.ai/pricing)

**驗證 API Key**：
```bash
# 需要根據 Cartesia 實際 API 文檔測試
# 通常可以通過列出可用語音來驗證
```

### 3. Claude API Key（語言理解）

**用途**：Claude LLM 對話生成

**申請步驟**：

1. 訪問 [Anthropic Console](https://console.anthropic.com/)
2. 註冊/登入帳號
3. 進入 **API Keys** 頁面
4. 創建新的 API Key
5. 複製並保存（格式：`sk-ant-...`）

**費用參考**：
- Claude 3.5 Haiku：輸入 $0.25/MTok，輸出 $1.25/MTok
- 示例：1000 次對話（平均 500 tokens/次）≈ $10-20

**驗證 API Key**：
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-haiku-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
```

**替代方案：OpenAI GPT**

如果使用 OpenAI GPT 代替 Claude：
- 設置 `LLM_PROVIDER=openai`
- 使用相同的 `OPENAI_API_KEY`
- 無需 `ANTHROPIC_API_KEY`

---

## ⚙️ 環境變數配置

### 完整環境變數列表

創建 `.env` 文件（本地開發）或在 Railway 中設置：

```env
# ========================================
# 語音識別（STT）
# ========================================
OPENAI_API_KEY=sk-...

# ========================================
# 語音合成（TTS）
# ========================================
CARTESIA_API_KEY=car_...
CARTESIA_VOICE_ID=your-voice-id-here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

# ========================================
# 語言理解（LLM）
# ========================================
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022

# 或使用 OpenAI GPT
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-...（與上面的相同）

# ========================================
# 伺服器配置
# ========================================
PORT=3000
NODE_ENV=production
```

### 環境變數說明

#### STT (語音識別)
| 變數名 | 必需 | 默認值 | 說明 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API 密鑰 |

#### TTS (語音合成)
| 變數名 | 必需 | 默認值 | 說明 |
|--------|------|--------|------|
| `CARTESIA_API_KEY` | ✅ | - | Cartesia API 密鑰 |
| `CARTESIA_VOICE_ID` | ✅ | - | 語音 ID |
| `CARTESIA_TTS_MODEL_ID` | ⚠️ | `sonic-3` | TTS 模型 |
| `CARTESIA_LANGUAGE` | ⚠️ | `zh` | 語音語言 |
| `CARTESIA_SAMPLE_RATE` | ⚠️ | `44100` | 音頻採樣率 |

#### LLM (語言理解)
| 變數名 | 必需 | 默認值 | 說明 |
|--------|------|--------|------|
| `LLM_PROVIDER` | ✅ | `claude` | LLM 提供商（claude/openai）|
| `ANTHROPIC_API_KEY` | ✅* | - | Claude API 密鑰 |
| `CLAUDE_MODEL` | ⚠️ | `claude-3-5-haiku-20241022` | Claude 模型 |

*當 `LLM_PROVIDER=claude` 時必需

---

## 💻 本地開發環境設置

### 1. 克隆項目

```bash
git clone https://github.com/waitinchen/Lingya-Voice-Agent.git
cd Lingya-Voice-Agent
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 配置環境變數

創建 `.env` 文件：

```bash
cp .env.example .env
# 或手動創建
touch .env
```

編輯 `.env`，填入所有 API Keys（參考上方環境變數配置）

### 4. 驗證配置

測試各個 API 是否正常：

```bash
# 測試 OpenAI Whisper
node test-openai.js

# 測試 Cartesia TTS
node test-cartesia.js

# 測試情緒標籤
node test-emotion-tags.js
```

### 5. 啟動服務

```bash
# 生產模式
npm start

# 開發模式（自動重啟）
npm run dev
```

成功啟動後應看到：

```
🚀 Server started on port 3000
   🌐 ChatKit 界面: http://localhost:3000
   🔐 管理後台: http://localhost:3000/admin
   📝 文字對話: POST http://localhost:3000/api/chat
   🎙️ 語音對話: POST http://localhost:3000/api/voice-chat
```

### 6. 測試語音功能

訪問 http://localhost:3000

**測試文字對話**：
1. 在輸入框輸入文字
2. 點擊發送
3. 查看回應並聽取語音

**測試語音對話**：
1. 點擊並按住 🎤 按鈕
2. 說話（應看到綠色波形動畫）
3. 放開按鈕
4. 等待處理（應看到思考動畫）
5. 查看回應並聽取語音

---

## 🚂 Railway 雲端部署

### 部署前檢查清單

確認以下項目已完成：

- [ ] 已獲取所有必需的 API Keys
  - [ ] OpenAI API Key
  - [ ] Cartesia API Key 和 Voice ID
  - [ ] Claude API Key（或選擇使用 OpenAI）
- [ ] 所有 API Keys 已驗證可用
- [ ] 已在本地成功測試語音功能
- [ ] 代碼已推送到 GitHub

### Railway 部署步驟

#### 1. 創建 Railway 項目

1. 訪問 [Railway](https://railway.app/)
2. 登入帳號（可用 GitHub 登入）
3. 點擊 **New Project**
4. 選擇 **Deploy from GitHub repo**
5. 選擇 `waitinchen/Lingya-Voice-Agent` 倉庫
6. 選擇分支（通常是 `main`）

#### 2. 配置環境變數

在 Railway 項目中：

1. 進入 **Service** → **Variables**
2. 點擊 **+ New Variable**
3. 逐一添加以下環境變數：

```env
OPENAI_API_KEY=sk-...
CARTESIA_API_KEY=car_...
CARTESIA_VOICE_ID=your-voice-id
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

**重要提醒**：
- 變數名稱**大小寫敏感**
- 不要包含多餘的空格或引號
- 確保所有必需變數都已添加

#### 3. 觸發部署

1. Railway 會自動檢測變更並開始部署
2. 查看 **Deployments** 標籤監控部署進度
3. 查看 **Logs** 確認部署狀態

#### 4. 獲取訪問 URL

部署成功後：

1. Railway 會自動分配一個公共 URL
2. 格式類似：`https://your-app.up.railway.app`
3. 或配置自定義域名（Settings → Networking）

### Railway 特定配置

Railway 會自動處理：
- **Port 分配**：自動設置 `PORT` 環境變數
- **構建檢測**：自動識別 Node.js 項目
- **啟動命令**：使用 `package.json` 中的 `npm start`

**檔案系統**：
- `tmp/` - 語音上傳暫存目錄（自動創建）
- `outputs/` - TTS 輸出檔案（可選）

---

## ✅ 語音功能驗證

### 部署後驗證清單

#### 1. 基礎健康檢查

```bash
curl https://your-app.railway.app/health
```

預期響應：
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 0,
  "websocket": "enabled",
  "environment": "production"
}
```

#### 2. 測試文字對話（含語音合成）

```bash
curl -X POST https://your-app.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，花小軟",
    "history": []
  }'
```

預期響應：
```json
{
  "success": true,
  "response": "...",
  "audioBase64": "...",
  "history": [...]
}
```

#### 3. 測試語音識別（STT）

準備一個音頻文件（如 `test.wav`），然後：

```bash
curl -X POST https://your-app.railway.app/api/transcribe \
  -F "audio=@test.wav" \
  -F "language=zh"
```

預期響應：
```json
{
  "success": true,
  "text": "轉錄的文字內容"
}
```

#### 4. 測試完整語音對話

```bash
curl -X POST https://your-app.railway.app/api/voice-chat \
  -F "audio=@test.wav" \
  -F "language=zh" \
  -F "history=[]"
```

預期響應：
```json
{
  "success": true,
  "text": "花小軟的回應",
  "transcribedText": "轉錄的用戶語音",
  "audio": "base64-encoded-audio",
  "history": [...]
}
```

#### 5. 瀏覽器測試

訪問：`https://your-app.railway.app`

**測試項目**：
- [ ] 頁面正常載入
- [ ] 可以發送文字訊息
- [ ] 文字訊息有語音回應
- [ ] 可以授權麥克風權限
- [ ] 可以錄製語音
- [ ] 語音可以正常識別
- [ ] 語音對話完整流程正常
- [ ] 綠色波形動畫顯示正常
- [ ] 思考動畫顯示正常

#### 6. 管理後台測試

訪問：`https://your-app.railway.app/admin`

**測試項目**：
- [ ] 登入頁面正常（帳號：admin / 密碼：admin）
- [ ] 可以查看系統提示詞
- [ ] 可以編輯系統提示詞
- [ ] 可以保存變更

---

## 🔧 常見問題排除

### 問題 1：語音識別失敗

**症狀**：
- 錯誤訊息：`OpenAI API Error`
- 語音上傳後無反應

**排查步驟**：

1. **檢查 OpenAI API Key**
   ```bash
   # 驗證 API Key
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   ```

2. **檢查環境變數**
   - Railway：確認 `OPENAI_API_KEY` 已設置
   - 本地：檢查 `.env` 文件

3. **檢查 API 配額**
   - 登入 [OpenAI Platform](https://platform.openai.com/)
   - 查看 **Usage** 和 **Billing**
   - 確認帳戶有餘額

4. **檢查音頻格式**
   - Whisper 支援：mp3, mp4, mpeg, mpga, m4a, wav, webm
   - 文件大小限制：25 MB

**解決方案**：
- 添加或更新正確的 `OPENAI_API_KEY`
- 確保帳戶有足夠的餘額
- 確認音頻格式正確

### 問題 2：語音合成失敗

**症狀**：
- 錯誤訊息：`Cartesia API Error`
- 有文字回應但無語音

**排查步驟**：

1. **檢查 Cartesia API Key**
   ```bash
   # 本地測試
   node test-cartesia.js
   ```

2. **檢查環境變數**
   - 確認 `CARTESIA_API_KEY` 已設置
   - 確認 `CARTESIA_VOICE_ID` 正確
   - 確認 `CARTESIA_TTS_MODEL_ID` 正確（默認 `sonic-3`）

3. **檢查 Cartesia 帳戶**
   - 登入 Cartesia Dashboard
   - 確認帳戶狀態正常
   - 確認 Voice ID 存在且可用

4. **檢查模型設置**
   - 確認使用的模型（`sonic-3` 或其他）
   - 確認語言設置正確（`zh` 為中文）

**解決方案**：
- 更新正確的 API Key 和 Voice ID
- 確認 Cartesia 帳戶狀態
- 調整模型設置

### 問題 3：LLM 回應失敗

**症狀**：
- 錯誤訊息：`Claude API Error` 或 `OpenAI API Error`
- 無法生成回應文字

**排查步驟**：

1. **檢查 LLM 提供商設置**
   ```env
   LLM_PROVIDER=claude  # 或 openai
   ```

2. **Claude 用戶**
   - 確認 `ANTHROPIC_API_KEY` 已設置
   - 確認模型名稱正確：`claude-3-5-haiku-20241022`
   - 驗證 API Key：
     ```bash
     curl https://api.anthropic.com/v1/messages \
       -H "x-api-key: YOUR_KEY" \
       -H "anthropic-version: 2023-06-01" \
       -H "content-type: application/json" \
       -d '{"model":"claude-3-5-haiku-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
     ```

3. **OpenAI 用戶**
   - 確認 `OPENAI_API_KEY` 已設置
   - 確認模型名稱（默認 `gpt-4`）

**解決方案**：
- 確認 `LLM_PROVIDER` 設置正確
- 更新對應的 API Key
- 確認 API 配額充足

### 問題 4：Railway 部署失敗

**症狀**：
- 部署狀態：Failed
- 服務無法啟動

**排查步驟**：

1. **查看 Railway Logs**
   - 進入 Railway Dashboard
   - 查看 Deployments → Logs
   - 找到錯誤訊息

2. **常見錯誤**
   - `Missing environment variable`：環境變數未設置
   - `Module not found`：依賴安裝失敗
   - `Port already in use`：端口配置問題

3. **檢查環境變數**
   - 逐一確認所有必需變數
   - 確認變數名稱正確（大小寫敏感）
   - 確認沒有多餘的空格或引號

**解決方案**：
- 根據錯誤訊息調整配置
- 重新設置環境變數
- 重新觸發部署

### 問題 5：語音功能在瀏覽器中不工作

**症狀**：
- 麥克風無法錄音
- 語音無法播放
- 實時轉錄不顯示

**排查步驟**：

1. **檢查瀏覽器權限**
   - 確認已授權麥克風權限
   - 檢查瀏覽器設置

2. **檢查瀏覽器兼容性**
   - Chrome/Edge：完全支援
   - Safari：支援（可能需要 webkit 前綴）
   - Firefox：部分支援（實時轉錄可能不可用）

3. **檢查 HTTPS**
   - Web Audio API 和 getUserMedia 需要 HTTPS
   - Railway 自動提供 HTTPS
   - 本地開發可以使用 localhost（視為安全上下文）

4. **檢查控制台錯誤**
   - 打開瀏覽器開發者工具（F12）
   - 查看 Console 標籤中的錯誤訊息

**解決方案**：
- 授權麥克風權限
- 使用支援的瀏覽器
- 確保使用 HTTPS（Railway 自動提供）
- 根據控制台錯誤調整

### 問題 6：語音延遲過高

**症狀**：
- 語音識別或合成響應慢
- 對話體驗不流暢

**排查步驟**：

1. **檢查 API 響應時間**
   - Whisper：通常 < 5 秒
   - Claude/OpenAI：通常 < 3 秒
   - Cartesia TTS：通常 < 2 秒

2. **檢查網絡延遲**
   - Railway 伺服器位置
   - 用戶網絡狀況

3. **檢查音頻大小**
   - 錄音時間過長會增加處理時間
   - 建議單次錄音 < 30 秒

**優化建議**：
- 使用更快的 LLM 模型（如 Haiku）
- 減少音頻採樣率（如 22050）
- 優化系統提示詞長度
- 考慮使用流式響應（未來功能）

---

## 💰 API 使用成本參考

### 估算基礎

假設：
- 平均每次對話：30 秒語音輸入，100 字回應
- 每日活躍用戶：10 人
- 每人每日對話：5 次

### 成本明細

#### OpenAI Whisper (STT)

**定價**：$0.006 / 分鐘

**估算**：
- 單次對話：30 秒 = 0.5 分鐘 = $0.003
- 每日：10 人 × 5 次 × $0.003 = $0.15
- 每月：$0.15 × 30 = **$4.50**

#### Cartesia TTS

**定價**：約 $0.01 - $0.05 / 1K characters（根據模型）

**估算**（假設 $0.03 / 1K chars）：
- 單次對話：100 字 = 0.1K chars = $0.003
- 每日：10 人 × 5 次 × $0.003 = $0.15
- 每月：$0.15 × 30 = **$4.50**

#### Claude API (LLM)

**定價**（Claude 3.5 Haiku）：
- 輸入：$0.25 / MTok
- 輸出：$1.25 / MTok

**估算**（假設單次 500 tokens 輸入 + 200 tokens 輸出）：
- 單次對話：(500 × $0.25 + 200 × $1.25) / 1M = $0.00038
- 每日：10 人 × 5 次 × $0.00038 = $0.019
- 每月：$0.019 × 30 = **$0.57**

### 總成本估算

| 服務 | 每月成本 |
|------|---------|
| OpenAI Whisper | $4.50 |
| Cartesia TTS | $4.50 |
| Claude LLM | $0.57 |
| **總計** | **$9.57** |

**說明**：
- 以上為保守估算
- 實際成本取決於使用量
- 建議設置 API 使用限制
- 定期監控 API 使用量

### 成本優化建議

1. **使用更便宜的 LLM 模型**
   - Claude 3.5 Haiku 比 Opus 便宜很多
   - OpenAI GPT-3.5 也是經濟選擇

2. **優化音頻處理**
   - 降低採樣率（22050 vs 44100）
   - 限制錄音長度

3. **緩存策略**
   - 緩存常見回應的語音
   - 使用語音預設

4. **監控和警報**
   - 設置 API 使用限制
   - 配置成本警報

---

## 📚 相關文檔

- [README.md](./README.md) - 項目完整介紹
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 一般部署指南
- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Railway 詳細設置
- [STEP3_VOICE_CHAT.md](./STEP3_VOICE_CHAT.md) - 語音功能開發歷程
- [docs/VOICE_PARAMS_TRANSLATION.md](./docs/VOICE_PARAMS_TRANSLATION.md) - 語氣參數轉譯
- [docs/REALTIME_VOICE_FEATURES.md](./docs/REALTIME_VOICE_FEATURES.md) - 實時語音功能

---

## 🎯 快速參考

### 必需環境變數（最小配置）

```env
# STT
OPENAI_API_KEY=sk-...

# TTS  
CARTESIA_API_KEY=car_...
CARTESIA_VOICE_ID=...

# LLM
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

### 驗證命令

```bash
# 健康檢查
curl https://your-app/health

# 測試文字對話
curl -X POST https://your-app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好","history":[]}'

# 測試語音識別
curl -X POST https://your-app/api/transcribe \
  -F "audio=@test.wav"
```

---

## 📞 支援

遇到問題？
- 查看 [常見問題排除](#常見問題排除)
- 檢查 Railway Logs
- 驗證 API Keys 有效性
- 查看瀏覽器控制台錯誤

---

**最後更新**：2025-11-06

> 「當聲音流動，便是靈魂醒來。」✨
