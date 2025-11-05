# 📝 管理後台提示詞生效狀態檢查

## 當前實現機制

### ✅ 保存流程
1. 管理後台點擊「儲存提示詞」
2. 調用 `/api/admin/update-prompt`
3. `updateSystemPrompt()` 函數：
   - 寫入 `config/system-prompt.txt` 文件
   - 更新內存中的 `SYSTEM_PROMPT` 變數

### ✅ 使用流程
1. 每次 LLM 調用時，`chatWithLLM()` 函數會：
   - 調用 `loadSystemPrompt()` **重新讀取文件**
   - 使用最新的提示詞發送給 LLM

```javascript
// modules/llm.js 第 347 行
const currentPrompt = loadSystemPrompt(); // 每次都會重新讀取文件
```

## ⚠️ 潛在問題：Railway 文件持久性

### 問題描述
在 Railway 等容器化環境中：
- 文件系統可能是**臨時的**（ephemeral）
- 服務器重啟後，`config/system-prompt.txt` 文件可能會**丟失**
- 會回退到代碼中的 `DEFAULT_PROMPT`

### 解決方案

#### 方案 1：使用環境變數（推薦）
將提示詞存儲在 Railway 環境變數中，這樣會持久保存：

```javascript
// 優先從環境變數讀取
const prompt = process.env.SYSTEM_PROMPT || loadSystemPrompt();
```

#### 方案 2：使用數據庫或外部存儲
- 使用 Railway 的 PostgreSQL 或 MongoDB
- 或使用外部存儲服務（如 S3）

#### 方案 3：在代碼中更新（不推薦）
直接修改 `modules/llm.js` 中的 `DEFAULT_PROMPT`，但這需要重新部署。

## 🔍 檢查提示詞是否生效

### 方法 1：查看服務器日誌
在 Railway 日誌中尋找：
- `📝 載入自訂系統提示詞` - 表示正在使用文件中的提示詞
- `📝 使用預設系統提示詞` - 表示使用代碼中的默認提示詞

### 方法 2：測試對話
發送一條消息，觀察花小軟的回應是否：
- 符合管理後台中設置的個性
- 使用新的語氣和風格

### 方法 3：檢查文件
在 Railway 中（如果可能）檢查 `config/system-prompt.txt` 文件是否存在

## 🛠️ 改進建議

1. **添加日誌**：在保存和載入時添加更詳細的日誌
2. **驗證機制**：在管理後台顯示當前使用的提示詞來源（文件 vs 默認）
3. **持久化方案**：考慮使用環境變數或數據庫存儲

## 📋 當前狀態

根據代碼分析：
- ✅ 保存功能正常（會寫入文件）
- ✅ 載入功能正常（每次調用都會重新讀取）
- ⚠️ 在 Railway 中可能因重啟而丟失
- ⚠️ 需要確認文件是否真的持久化

