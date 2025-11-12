# ✅ 語音系統部署檢查清單

完整的語音功能部署前後檢查清單，確保所有語音相關功能正常運作。

---

## 📋 部署前檢查

### 1. API 密鑰準備

- [ ] **OpenAI API Key** 已獲取並測試
  - 訪問: https://platform.openai.com/api-keys
  - 餘額: ≥ $10
  - 測試: `node test-openai.js`

- [ ] **Cartesia API Key** 已獲取並測試
  - 訪問: https://cartesia.ai/
  - Voice ID 已獲取
  - 測試: `node test-cartesia.js`

- [ ] **Claude API Key** 已獲取並測試（或 OpenAI）
  - 訪問: https://console.anthropic.com/
  - 測試: `node test-claude.js` 或使用 `/api/chat` 端點

### 2. 環境變數配置

#### 必需變數 (9個)

- [ ] `OPENAI_API_KEY` - OpenAI API 密鑰
- [ ] `CARTESIA_API_KEY` - Cartesia API 密鑰
- [ ] `CARTESIA_VOICE_ID` - Cartesia 語音 ID
- [ ] `CARTESIA_TTS_MODEL_ID` - TTS 模型（推薦: sonic-3）
- [ ] `CARTESIA_LANGUAGE` - 語言設置（zh/en/ja）
- [ ] `CARTESIA_SAMPLE_RATE` - 採樣率（44100/22050）
- [ ] `LLM_PROVIDER` - LLM 提供商（claude/openai）
- [ ] `ANTHROPIC_API_KEY` - Claude API 密鑰
- [ ] `CLAUDE_MODEL` - Claude 模型名稱

#### 可選變數

- [ ] `PORT` - 伺服器端口（默認 3000）
- [ ] `NODE_ENV` - 環境模式（production/development）
- [ ] `TTS_PROVIDER` - TTS 提供商（默認 cartesia）

### 3. 代碼準備

- [ ] 所有語音相關模組存在且無語法錯誤
  - `modules/stt.js` - 語音識別
  - `modules/tts-cartesia.js` - 語音合成
  - `modules/voiceConversation.js` - 語音對話流程
  - `helpers/emotion.js` - 情緒標籤
  - `modules/voice-params.js` - 語氣參數

- [ ] 依賴包已安裝
  ```bash
  npm install
  ```

- [ ] 本地測試通過
  ```bash
  npm start
  # 訪問 http://localhost:3000
  ```

### 4. 文件系統

- [ ] `tmp/` 目錄權限正確（用於臨時音頻文件）
- [ ] `outputs/` 目錄已加入 `.gitignore`
- [ ] 臨時文件自動清理機制正常

---

## 🚀 部署過程檢查

### Railway 部署

- [ ] GitHub 倉庫已連接
- [ ] 分支選擇正確（main）
- [ ] 所有環境變數已在 Railway Variables 中設置
- [ ] 構建日誌顯示成功
  ```
  ✅ Dependencies installed
  ✅ Build completed
  ✅ Deployment successful
  ```

### 服務器啟動

- [ ] 服務器啟動成功
  ```
  🚀 Server started on port XXXXX
  🌐 ChatKit 界面: http://localhost:XXXXX
  ```

- [ ] 無環境變數錯誤
- [ ] 無模組導入錯誤
- [ ] 端口綁定成功

---

## ✅ 部署後驗證

### 1. 基礎健康檢查

- [ ] **健康端點響應正常**
  ```bash
  curl https://your-app.railway.app/health
  ```
  預期: `{"status":"ok",...}`

- [ ] **主頁訪問正常**
  ```bash
  curl https://your-app.railway.app/
  ```
  預期: 返回 HTML 頁面

### 2. 語音識別（STT）測試

- [ ] **API 端點可訪問**
  ```bash
  curl -X POST https://your-app.railway.app/api/transcribe \
    -F "audio=@test.wav" \
    -F "language=zh"
  ```

- [ ] **識別準確度測試**
  - 測試中文語音: ✅ / ❌
  - 測試英文語音: ✅ / ❌
  - 測試噪音環境: ✅ / ❌

- [ ] **錯誤處理正常**
  - 空音頻文件: 返回錯誤信息
  - 無效格式: 返回錯誤信息
  - 超大文件: 返回錯誤信息

### 3. 語音合成（TTS）測試

- [ ] **基礎合成功能**
  ```bash
  curl -X POST https://your-app.railway.app/api/speak \
    -H "Content-Type: application/json" \
    -d '{"text":"你好，我是花小軟"}' \
    --output test.wav
  ```
  - 生成的音頻可播放: ✅ / ❌
  - 發音清晰自然: ✅ / ❌
  - 無雜音或失真: ✅ / ❌

- [ ] **串流模式**
  ```bash
  curl -X POST https://your-app.railway.app/api/speak-stream \
    -H "Content-Type: application/json" \
    -d '{"text":"測試串流"}' \
    --output test-stream.wav
  ```

- [ ] **情緒標籤測試**
  - Flirty（撒嬌）: ✅ / ❌
  - Warm（溫暖）: ✅ / ❌
  - Excited（興奮）: ✅ / ❌
  - Whisper（耳語）: ✅ / ❌
  
  測試方法:
  ```bash
  curl -X POST https://your-app.railway.app/api/speak \
    -H "Content-Type: application/json" \
    -d '{
      "text": "老爸～",
      "voiceParams": {
        "emotionTags": ["flirty"]
      }
    }' \
    --output test-emotion.wav
  ```

### 4. 完整語音對話測試

- [ ] **端到端流程**
  1. 打開瀏覽器訪問主頁
  2. 點擊 🎤 麥克風按鈕
  3. 說話: "你好"
  4. 驗證:
     - 語音識別顯示正確文字: ✅ / ❌
     - LLM 生成合適回應: ✅ / ❌
     - 語音合成播放流暢: ✅ / ❌
     - 整體延遲可接受 (< 5秒): ✅ / ❌

- [ ] **多輪對話測試**
  - 連續對話 3-5 輪
  - 上下文記憶正確: ✅ / ❌
  - 情緒連貫性: ✅ / ❌

- [ ] **並發測試**
  - 多個用戶同時使用
  - 無互相干擾: ✅ / ❌
  - 響應時間穩定: ✅ / ❌

### 5. 語氣參數系統測試

- [ ] **語氣標籤轉換**
  ```bash
  npm test
  node test-emotion-tags.js
  ```

- [ ] **預設語氣測試**
  - Gentle（溫柔）: ✅ / ❌
  - Cute（可愛）: ✅ / ❌
  - Excited（興奮）: ✅ / ❌
  - Soft（輕柔）: ✅ / ❌

### 6. 錯誤處理測試

- [ ] **API Key 無效**
  - 測試方法: 暫時修改環境變數為無效值
  - 預期: 返回友好錯誤信息
  - 不應導致服務器崩潰: ✅ / ❌

- [ ] **網絡超時**
  - 模擬網絡延遲
  - 預期: 超時後返回錯誤
  - 用戶體驗可接受: ✅ / ❌

- [ ] **無效輸入**
  - 空文本
  - 超長文本 (>1000 字)
  - 特殊字符
  - 預期: 所有情況都有適當處理: ✅ / ❌

---

## 📊 性能驗證

### 1. 響應時間

測試並記錄以下指標：

- [ ] **STT 平均響應時間**: _______ ms (目標: < 2000ms)
- [ ] **LLM 平均響應時間**: _______ ms (目標: < 3000ms)
- [ ] **TTS 平均響應時間**: _______ ms (目標: < 2000ms)
- [ ] **完整對話平均時間**: _______ ms (目標: < 5000ms)

測試方法:
```bash
curl https://your-app.railway.app/api/stats
```

### 2. 錯誤率監控

- [ ] **STT 錯誤率**: _______ % (目標: < 5%)
- [ ] **TTS 錯誤率**: _______ % (目標: < 2%)
- [ ] **LLM 錯誤率**: _______ % (目標: < 3%)

### 3. 資源使用

- [ ] **內存使用**: _______ MB (目標: < 500MB)
- [ ] **CPU 使用**: _______ % (目標: < 80%)
- [ ] **磁盤空間**: _______ MB (目標: 足夠剩餘)

查看方法: Railway Dashboard → Metrics

---

## 🔒 安全檢查

- [ ] **API 密鑰保護**
  - 所有密鑰存儲在環境變數中
  - `.env` 文件已加入 `.gitignore`
  - 代碼中無硬編碼密鑰

- [ ] **輸入驗證**
  - 文本長度限制
  - 音頻文件大小限制
  - 文件類型驗證

- [ ] **CORS 配置**
  - CORS 設置適當（如需要）
  - 僅允許信任的來源

---

## 📚 文檔檢查

- [ ] **README.md 已更新**
  - 包含語音部署相關信息
  - 鏈接到語音部署指南

- [ ] **環境變數文檔完整**
  - 所有必需變數都有說明
  - 包含示例值

- [ ] **故障排除指南可用**
  - 常見問題有解決方案
  - 聯繫方式明確

---

## 🎯 生產就緒檢查

### 最終確認

- [ ] 所有上述測試項目都通過 ✅
- [ ] 無重大錯誤或警告
- [ ] 用戶可以正常使用語音功能
- [ ] 監控系統已設置（如 `/health` 定期檢查）
- [ ] 備份和回滾方案已準備

### API 配額確認

- [ ] **OpenAI 配額充足** (建議: > $20)
- [ ] **Cartesia 配額充足** (根據預期使用量)
- [ ] **Claude 配額充足** (或 OpenAI 作為備用)
- [ ] 配額警報已設置（低於閾值時通知）

### 支持準備

- [ ] 團隊成員了解語音系統架構
- [ ] 故障排除指南已分享
- [ ] 監控儀表板可訪問
- [ ] 聯繫方式和升級路徑明確

---

## 📝 部署記錄

### 部署信息

- **部署日期**: _______________
- **部署人員**: _______________
- **部署環境**: Railway / Other: _______________
- **應用 URL**: _______________

### 版本信息

- **代碼版本**: _______________
- **Node.js 版本**: _______________
- **關鍵依賴版本**:
  - OpenAI SDK: _______________
  - Cartesia SDK: _______________
  - Anthropic SDK: _______________

### 配置信息

- **TTS 模型**: _______________
- **LLM 模型**: _______________
- **採樣率**: _______________
- **語言**: _______________

### 測試結果

- **所有測試通過**: ✅ / ❌
- **已知問題**: _______________
- **待改進項**: _______________

### 簽核

- **技術負責人**: _______________ (簽名/日期)
- **質量檢查**: _______________ (簽名/日期)

---

## 🔄 後續維護

### 每日檢查

- [ ] 查看 Railway 日誌是否有錯誤
- [ ] 檢查 `/health` 端點狀態
- [ ] 監控 API 配額使用

### 每週檢查

- [ ] 查看 `/api/stats` 性能指標
- [ ] 檢查錯誤率是否異常
- [ ] 驗證平均響應時間
- [ ] 檢查用戶反饋

### 每月檢查

- [ ] 更新依賴包
- [ ] 檢查 API 提供商更新
- [ ] 優化配置（成本/性能）
- [ ] 備份配置文件
- [ ] 審查和更新文檔

---

**檢查清單版本**: v1.0  
**最後更新**: 2025-11-06  
**適用於**: Lingya Voice Agent v0.1.0+

---

## 📎 相關資源

- [VOICE_DEPLOYMENT_GUIDE.md](../VOICE_DEPLOYMENT_GUIDE.md) - 完整部署指南
- [RAILWAY_SETUP.md](../RAILWAY_SETUP.md) - Railway 設置指南
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 通用部署檢查清單
