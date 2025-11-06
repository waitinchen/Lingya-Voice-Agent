# 部署檢查清單

**部署時間：** 2025-11-05  
**版本：** Phase 7 完成版

---

## ✅ 部署前檢查

### 1. 代碼狀態
- ✅ 所有 Phase 7 功能已完成
- ✅ 語法檢查通過
- ✅ 無 linter 錯誤
- ✅ 已提交到 Git

### 2. 新增功能
- ✅ 性能監控基礎設施 (`modules/performance-monitor.js`)
- ✅ 緩衝區管理 (`modules/buffer-manager.js`)
- ✅ 健康檢查端點 (`/health`)
- ✅ 性能統計端點 (`/api/stats`)
- ✅ 測試框架（原生 Node.js）

### 3. 環境變數檢查

確保 Railway 環境變數已設置：

**必需：**
- `CARTESIA_API_KEY` - Cartesia API 密鑰
- `CARTESIA_VOICE_ID` - Cartesia 語音 ID
- `OPENAI_API_KEY` - OpenAI API 密鑰（用於 Whisper STT）
- `ANTHROPIC_API_KEY` - Anthropic API 密鑰（用於 Claude LLM）

**可選：**
- `PORT` - 服務器端口（默認 3000）
- `NODE_ENV` - 環境（production/development）
- `TTS_PROVIDER` - TTS 提供商（默認 cartesia）

---

## 🚀 部署步驟

### Railway 自動部署

1. **推送代碼到 GitHub**
   ```bash
   git push origin main
   ```

2. **Railway 自動檢測**
   - Railway 會自動檢測到新的推送
   - 開始構建和部署流程

3. **檢查部署日誌**
   - 在 Railway Dashboard 查看構建日誌
   - 確認構建成功
   - 確認服務器啟動成功

4. **驗證部署**
   - 訪問 `https://your-app.railway.app/health`
   - 應該返回健康狀態
   - 訪問 `https://your-app.railway.app/api/stats`
   - 應該返回性能統計（初始數據可能為空）

---

## 🔍 部署後驗證

### 1. 健康檢查
```bash
curl https://your-app.railway.app/health
```

**預期響應：**
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 0,
  "websocket": "enabled",
  "environment": "production",
  "version": "0.1.0"
}
```

### 2. 性能統計
```bash
curl https://your-app.railway.app/api/stats
```

**預期響應：**
```json
{
  "requests": {
    "total": 0,
    "errors": 0,
    "errorRate": 0,
    "avgResponseTime": 0
  },
  "websocket": {
    "activeConnections": 0,
    "totalConnections": 0,
    "messages": 0,
    "errors": 0
  },
  "tts": { "calls": 0, "errors": 0, "errorRate": 0, "avgDuration": 0 },
  "llm": { "calls": 0, "errors": 0, "errorRate": 0, "avgDuration": 0 },
  "stt": { "calls": 0, "errors": 0, "errorRate": 0, "avgDuration": 0 },
  "memory": { "heapUsedMB": 0, "heapTotalMB": 0, "rssMB": 0, "heapUsagePercent": 0 },
  "uptime": 0,
  "timestamp": "..."
}
```

### 3. 主應用
- 訪問主頁面
- 測試語音對話功能
- 測試 WebSocket 連接

---

## 🐛 常見問題

### 1. 構建失敗
- **檢查：** Railway 日誌中的錯誤信息
- **常見原因：** 缺少環境變數、依賴安裝失敗

### 2. 服務器啟動失敗
- **檢查：** Railway 日誌中的啟動錯誤
- **常見原因：** 端口衝突、環境變數缺失、模組導入錯誤

### 3. WebSocket 連接失敗
- **檢查：** Railway 是否支持 WebSocket
- **檢查：** 環境變數 `RAILWAY_ENVIRONMENT` 是否設置

### 4. 性能監控無數據
- **正常：** 初始部署時，所有指標為 0
- **使用後：** 發送一些請求後，指標會更新

---

## 📊 監控建議

### 部署後監控
1. **健康檢查端點**
   - 設置定期檢查 `/health`
   - 監控服務器狀態

2. **性能統計端點**
   - 定期查看 `/api/stats`
   - 監控錯誤率和響應時間
   - 監控內存使用

3. **Railway 監控**
   - 查看 Railway Dashboard 的資源使用
   - 監控 CPU、內存、網絡

---

## 🔄 回滾方案

如果部署出現問題：

1. **Git 回滾**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Railway 回滾**
   - 在 Railway Dashboard 中選擇之前的部署
   - 點擊 "Redeploy"

---

## 📝 部署日誌

**部署時間：** 2025-11-05  
**提交哈希：** (git log 中的最新 commit)  
**功能版本：** Phase 7 - 性能監控與優化  
**狀態：** ✅ 已部署

---

**最後更新：** 2025-11-05


