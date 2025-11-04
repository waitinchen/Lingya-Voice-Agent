# 🔍 TTS 500 錯誤診斷指南

## 常見問題和解決方案

### 1. 環境變數未設置

**症狀：** 返回 500 錯誤，錯誤信息包含 "environment variable is missing"

**解決方案：**
在 Railway Service Variables 中設置：
- `CARTESIA_API_KEY` - **必需**
- `CARTESIA_TTS_MODEL_ID` - 建議設置為 `sonic-3`
- `CARTESIA_VOICE_ID` - 可選（如果不設置，會根據語氣標籤自動選擇）

### 2. Cartesia API Key 無效或過期

**症狀：** 返回 401 或 403 錯誤

**解決方案：**
1. 檢查 Cartesia Dashboard 中的 API Key 是否有效
2. 確認 API Key 有 TTS 權限
3. 重新生成 API Key 並更新 Railway 環境變數

### 3. VoiceID 不存在或無效

**症狀：** 返回 404 或 400 錯誤，錯誤信息包含 "voice" 或 "not found"

**解決方案：**
1. 確認 VoiceID 在 Cartesia 賬戶中存在
2. 檢查 `VOICE_MAP` 中的 VoiceID 是否正確：
   - `warm`: `7d74df0d-5645-441e-ad73-7c83a6032960`
   - `whisper`: `95716f5f-6280-41a5-a0b0-54cd4b5cf9bf`
   - `playful`: `65bd7b95-1aa7-4f33-a125-49bdf7373c55`
   - `excited`: `06ba0621-5325-4303-b90a-e18e04f7cdbc`
   - `neutral`: `56029d8e-d54a-46a0-b7d5-65fc6bbff62d`
3. 如果 VoiceID 無效，設置 `CARTESIA_VOICE_ID` 環境變數使用你的默認 VoiceID

### 4. 模型 ID 不正確

**症狀：** 返回 400 錯誤

**解決方案：**
- 確認 `CARTESIA_TTS_MODEL_ID` 設置為 `sonic-3` 或 `sonic-v2`
- 檢查 Cartesia 文檔確認模型名稱是否正確

### 5. 網絡連接問題

**症狀：** 請求超時或網絡錯誤

**解決方案：**
1. 檢查 Railway 服務器網絡連接
2. 確認 Cartesia API 服務器可訪問
3. 檢查 Railway 防火牆設置

## 診斷步驟

### 步驟 1：檢查 Railway 日誌

查看 Railway 部署日誌，尋找：
```
❌ Cartesia API 調用失敗:
   錯誤類型: ...
   錯誤消息: ...
   HTTP 狀態: ...
```

### 步驟 2：本地測試

運行診斷腳本：
```bash
node test-cartesia-api.js
```

這會測試：
- 環境變數是否正確
- Cartesia API 是否可訪問
- VoiceID 是否有效

### 步驟 3：檢查環境變數

在 Railway Dashboard 確認以下變數：
- `CARTESIA_API_KEY` - 必須設置
- `CARTESIA_TTS_MODEL_ID` - 建議設置為 `sonic-3`
- `CARTESIA_VOICE_ID` - 可選（如果設置了，會優先使用）

### 步驟 4：驗證 VoiceID

如果使用 `VOICE_MAP` 中的 VoiceID，確保：
1. 這些 VoiceID 在你的 Cartesia 賬戶中存在
2. 你有權限使用這些 VoiceID

如果 VoiceID 不存在，有兩個選擇：
1. 在 Railway 中設置 `CARTESIA_VOICE_ID` 使用你的默認 VoiceID
2. 更新 `modules/tts-cartesia.js` 中的 `VOICE_MAP` 為你的 VoiceID

## 快速修復檢查清單

- [ ] `CARTESIA_API_KEY` 已設置且有效
- [ ] `CARTESIA_TTS_MODEL_ID` 設置為 `sonic-3`
- [ ] 如果使用 `VOICE_MAP`，VoiceID 在賬戶中存在
- [ ] 或者設置 `CARTESIA_VOICE_ID` 使用默認 VoiceID
- [ ] Railway 服務器網絡連接正常
- [ ] Cartesia API 服務器可訪問

## 聯繫支持

如果問題持續存在，請提供：
1. Railway 日誌中的完整錯誤信息
2. 本地測試結果（`test-cartesia-api.js`）
3. 環境變數配置（隱藏敏感信息）

