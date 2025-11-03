# 🚀 Railway 部署指南

## 📋 部署前準備

### 1. 環境變數配置

在 Railway 的 Service Variables 中配置以下環境變數：

#### 必需變數

```env
# OpenAI API（語音識別）
OPENAI_API_KEY=your_openai_api_key_here

# Cartesia TTS（語音合成）
CARTESIA_API_KEY=your_cartesia_api_key_here
CARTESIA_VOICE_ID=your_cartesia_voice_id_here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

# LLM 提供商
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-3-5-haiku-20241022

# 伺服器端口（Railway 自動設置，通常不需要手動設置）
PORT=3000
```

### 2. Railway 配置

Railway 會自動檢測：
- **Builder**: NIXPACKS（自動檢測 Node.js 項目）
- **Start Command**: `npm start`（從 package.json）
- **Port**: 從 `PORT` 環境變數或 Railway 自動分配

### 3. 部署流程

1. **連接 GitHub 倉庫**
   - 在 Railway 中創建新項目
   - 選擇 GitHub 倉庫：`waitinchen/Lingya-Voice-Agent`
   - 選擇分支：`main`

2. **設置環境變數**
   - 進入 Service → Variables
   - 添加所有必需的環境變數（見上方列表）

3. **部署**
   - Railway 會自動檢測變更並部署
   - 查看 Logs 確認部署狀態

4. **獲取 URL**
   - Railway 會自動分配一個公共 URL
   - 格式：`https://your-project-name.up.railway.app`

---

## 🔧 Railway 特定配置

### Port 設置

Railway 會自動設置 `PORT` 環境變數，我們的 `server.js` 已經支持：

```javascript
const PORT = process.env.PORT || 3000;
```

### 文件系統

Railway 的臨時文件系統：
- `tmp/` - 語音上傳臨時文件
- `outputs/` - TTS 輸出文件（可選）

這些目錄會在部署時自動創建。

---

## 📊 監控和日誌

### 查看日誌

1. 在 Railway Dashboard 中選擇服務
2. 點擊 "Logs" 標籤
3. 查看實時日誌輸出

### 關鍵日誌

部署成功後，應該看到：

```
🚀 Server started on port XXXXX
   🌐 ChatKit 界面: http://localhost:XXXXX
   🔐 管理後台: http://localhost:XXXXX/admin
   ...
```

---

## 🔍 故障排除

### 常見問題

1. **環境變數未設置**
   - 檢查所有必需的環境變數是否都已設置
   - 確保沒有拼寫錯誤

2. **端口衝突**
   - Railway 會自動分配端口，確保使用 `process.env.PORT`

3. **依賴安裝失敗**
   - 檢查 `package.json` 中的依賴是否正確
   - 查看 Build Logs 確認錯誤信息

4. **服務無法啟動**
   - 查看 Logs 中的錯誤信息
   - 確認 `npm start` 命令能正常運行

### 測試部署

部署完成後，訪問：
- `https://your-project-name.up.railway.app` - ChatKit 界面
- `https://your-project-name.up.railway.app/admin` - 管理後台

---

## 🌐 自定義域名（可選）

1. 在 Railway 項目設置中
2. 選擇 "Settings" → "Networking"
3. 添加自定義域名

---

## 📝 環境變數檢查清單

在部署前，確認以下變數都已設置：

- [ ] `OPENAI_API_KEY`
- [ ] `CARTESIA_API_KEY`
- [ ] `CARTESIA_VOICE_ID`
- [ ] `CARTESIA_TTS_MODEL_ID`
- [ ] `CARTESIA_LANGUAGE`
- [ ] `CARTESIA_SAMPLE_RATE`
- [ ] `LLM_PROVIDER`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `CLAUDE_MODEL`

---

## 🔗 相關連結

- [Railway 文檔](https://docs.railway.app/)
- [GitHub 倉庫](https://github.com/waitinchen/Lingya-Voice-Agent)

