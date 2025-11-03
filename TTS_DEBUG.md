# 🔍 TTS 聲音播放問題調試指南

## 問題診斷

根據 MCP Chrome DevTools 檢測，生產環境出現以下問題：

### 發現的錯誤

```
POST https://lva.angelslab.io/api/speak-stream [failed - 500]
錯誤: {"error":"TTS failed"}
```

### 可能的原因

1. **環境變數未設置**：
   - `CARTESIA_API_KEY` 缺失或無效
   - `CARTESIA_VOICE_ID` 缺失或無效

2. **Cartesia API 調用失敗**：
   - API Key 無效或已過期
   - Voice ID 不存在或無權限訪問
   - API 配額用盡

3. **網絡或服務器問題**：
   - Railway 服務器無法訪問 Cartesia API
   - API 響應格式異常

## 🔧 修復方案

### 1. 檢查 Railway 環境變數

請確認以下環境變數都已正確設置：

```
CARTESIA_API_KEY=your_api_key_here
CARTESIA_VOICE_ID=your_voice_id_here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100
```

### 2. 查看 Railway Logs

訪問 Railway Dashboard → Logs，查看具體錯誤信息：

```
❌ Cartesia TTS 錯誤：...
   錯誤詳情：...
   HTTP 狀態碼：...
```

### 3. 測試步驟

1. **檢查環境變數**：
   - Railway → Service → Variables
   - 確認所有 Cartesia 相關變數都已設置

2. **查看詳細錯誤**：
   - 發送一條測試消息
   - 檢查瀏覽器控制台的錯誤詳情
   - 現在會返回更詳細的錯誤信息（包含 `hint`）

3. **驗證 API Key**：
   - 確認 `CARTESIA_API_KEY` 格式正確
   - 確認 `CARTESIA_VOICE_ID` 是有效的 UUID

## 📝 已實施的改進

### 1. 環境變數檢查

在 `synthesizeSpeechCartesiaToBuffer` 函數開始時檢查：
- `CARTESIA_API_KEY` 是否存在
- `CARTESIA_VOICE_ID` 是否存在

### 2. 詳細錯誤處理

- 拋出具體錯誤而非返回 `null`
- 記錄完整的錯誤堆疊
- 返回詳細的錯誤信息和提示

### 3. API 響應驗證

- 檢查音頻 Buffer 是否為空
- 記錄生成的音頻大小
- 提供更明確的錯誤信息

## 🚀 下一步

1. 部署更新後的代碼
2. 再次測試，查看新的錯誤信息
3. 根據錯誤信息調整環境變數或修復問題

## 📊 預期的錯誤信息格式

成功時：
```
✅ Cartesia TTS 成功生成音頻，大小: XX.XX KB
```

失敗時（環境變數）：
```json
{
  "error": "CARTESIA_API_KEY environment variable is missing",
  "hint": "請檢查 Railway 環境變數設置"
}
```

失敗時（API 調用）：
```json
{
  "error": "Cartesia API error: ...",
  "hint": "TTS API 調用失敗，請檢查 Cartesia API Key 和 Voice ID"
}
```

