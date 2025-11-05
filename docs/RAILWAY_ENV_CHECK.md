# 🔍 Railway 環境變數配置檢查清單

## 當前配置（從 Railway Dashboard）

根據 Railway Variables 頁面顯示：

### ✅ 已正確設置的變數：

1. **CARTESIA_API_KEY**: `sk_car_oKdwNrwqmegsmQF3Aeyckq`
   - ✅ 格式正確（以 `sk_car_` 開頭）
   - ⚠️ 注意：最後是 `eyckq`（小寫 k），請確認是否與 Cartesia Dashboard 中的完全一致

2. **CARTESIA_LANGUAGE**: `zh`
   - ✅ 正確

3. **CARTESIA_SAMPLE_RATE**: `44100`
   - ✅ 正確

4. **CARTESIA_TTS_MODEL_ID**: `sonic-3`
   - ✅ 正確

5. **CARTESIA_VOICE_ID**: `d3cb9a1f-73d1-48d4-8ee9-53183b40e284`
   - ✅ 已設置（這是你的默認 VoiceID）

### 🔐 其他變數（已隱藏，但應已設置）：

- `ANTHROPIC_API_KEY` - Claude API Key
- `CLAUDE_MODEL` - Claude 模型名稱
- `LLM_PROVIDER` - LLM 提供商（應為 `claude`）
- `OPENAI_API_KEY` - OpenAI API Key（備用）

## ⚠️ 重要檢查點

### 1. CARTESIA_API_KEY 驗證

**當前值：** `sk_car_oKdwNrwqmegsmQF3Aeyckq`

**請確認：**
- 在 Cartesia Dashboard 中，這個 Key 的完整值是否真的是 `sk_car_oKdwNrwqmegsmQF3Aeyckq`？
- 注意最後是 `eyckq`（小寫 k），而不是 `eycKq`（大寫 K）
- 如果 Dashboard 中顯示的是 `eycKq`（大寫），請更新 Railway 中的值

### 2. CARTESIA_VOICE_ID

**當前值：** `d3cb9a1f-73d1-48d4-8ee9-53183b40e284`

這個 VoiceID 會優先使用（因為環境變數已設置），而不是 `VOICE_MAP` 中的 VoiceID。

**選項：**
- 如果想使用 `VOICE_MAP` 中的不同聲音（根據語氣標籤），可以**移除**這個環境變數
- 如果想始終使用這個 VoiceID，保持現狀即可

## 🧪 測試建議

1. **確認 API Key 正確性：**
   ```bash
   # 在本地 .env 中設置
   CARTESIA_API_KEY=sk_car_oKdwNrwqmegsmQF3Aeyckq
   
   # 運行測試
   node test-cartesia-api.js
   ```

2. **檢查 Railway 日誌：**
   - 查看部署日誌，確認是否有錯誤
   - 尋找 `✅ Cartesia 客戶端已初始化` 或 `❌ Cartesia API 調用失敗`

3. **測試語音生成：**
   - 訪問應用
   - 發送一條消息
   - 檢查語音是否正常生成

## 📝 如果仍然有問題

如果語音仍然無法生成，請檢查：

1. **Railway 日誌中的錯誤信息**
   - 尋找 `❌ Cartesia API 調用失敗:`
   - 查看具體的錯誤消息和 HTTP 狀態碼

2. **API Key 是否有效**
   - 在 Cartesia Dashboard 確認 Key 是否有效
   - 確認 Key 是否被正確複製（沒有多餘空格）

3. **VoiceID 是否有效**
   - 確認 `d3cb9a1f-73d1-48d4-8ee9-53183b40e284` 在你的 Cartesia 賬戶中存在

