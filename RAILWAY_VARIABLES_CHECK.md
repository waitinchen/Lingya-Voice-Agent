# ✅ Railway 環境變數檢查清單

## 📋 已配置的變數（從圖片確認）

根據 Railway Variables 頁面顯示，以下變數已設置：

| 變數名 | 狀態 | 可見值 | 說明 |
|--------|------|--------|------|
| `OPENAI_API_KEY` | ✅ 已設置 | `sk-proj-1tr6jh...` | OpenAI API 密鑰（完整可見） |
| `ANTHROPIC_API_KEY` | ✅ 已設置 | `*******` | Claude API 密鑰（已隱藏） |
| `CARTESIA_API_KEY` | ✅ 已設置 | `*******` | Cartesia API 密鑰（已隱藏） |
| `CARTESIA_VOICE_ID` | ✅ 已設置 | `*******` | Cartesia 語音 ID（已隱藏） |
| `CARTESIA_TTS_MODEL_ID` | ✅ 已設置 | `sonic-3` | ✅ 正確 |
| `CARTESIA_LANGUAGE` | ✅ 已設置 | `*******` | 應該是 `zh` |
| `CARTESIA_SAMPLE_RATE` | ✅ 已設置 | `*******` | 應該是 `44100` |
| `LLM_PROVIDER` | ✅ 已設置 | `*******` | 應該是 `claude` |
| `CLAUDE_MODEL` | ✅ 已設置 | `claude-3-5-haiku-20241022` | ✅ 正確 |

---

## 🔍 需要確認的值

以下變數已設置但值被隱藏，請點擊眼睛圖標確認值是否正確：

### 1. `LLM_PROVIDER`
- **應該設置為**：`claude`
- **檢查方法**：點擊眼睛圖標查看值
- **如果錯誤**：改為 `claude`

### 2. `CARTESIA_LANGUAGE`
- **應該設置為**：`zh`
- **檢查方法**：點擊眼睛圖標查看值
- **如果錯誤**：改為 `zh`

### 3. `CARTESIA_SAMPLE_RATE`
- **應該設置為**：`44100`
- **檢查方法**：點擊眼睛圖標查看值
- **如果錯誤**：改為 `44100`

### 4. `ANTHROPIC_API_KEY`
- **應該格式**：以 `sk-ant-` 開頭
- **檢查方法**：點擊眼睛圖標確認格式
- **如果缺失**：從 Anthropic Console 獲取

### 5. `CARTESIA_API_KEY`
- **應該格式**：Cartesia API 密鑰
- **檢查方法**：點擊眼睛圖標確認格式
- **如果缺失**：從 Cartesia 平台獲取

### 6. `CARTESIA_VOICE_ID`
- **應該格式**：UUID 格式
- **檢查方法**：點擊眼睛圖標確認格式
- **如果缺失**：從 Cartesia 平台創建語音後獲取

---

## ✅ 已確認正確的值

- `CARTESIA_TTS_MODEL_ID` = `sonic-3` ✅
- `CLAUDE_MODEL` = `claude-3-5-haiku-20241022` ✅
- `OPENAI_API_KEY` = 完整密鑰（可見） ✅

---

## 🎯 完整配置清單（複製到 Railway）

如果發現任何變數缺失或錯誤，請使用以下清單：

```env
OPENAI_API_KEY=sk-...

CARTESIA_API_KEY=your_cartesia_api_key_here
CARTESIA_VOICE_ID=your_cartesia_voice_id_here
CARTESIA_TTS_MODEL_ID=sonic-3
CARTESIA_LANGUAGE=zh
CARTESIA_SAMPLE_RATE=44100

LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

---

## 📝 建議檢查步驟

1. **點擊所有隱藏的變數**，確認值是否正確
2. **特別注意**：
   - `LLM_PROVIDER` 應該是 `claude`（不是 `openai`）
   - `CARTESIA_LANGUAGE` 應該是 `zh`（不是 `en` 或其他）
   - `CARTESIA_SAMPLE_RATE` 應該是 `44100`（數字，無引號）

3. **如果發現錯誤**：
   - 點擊變數右側的 ⋮ 圖標
   - 選擇 "Edit" 或 "Update"
   - 修改值並保存

4. **保存後**：
   - Railway 會自動重新部署
   - 查看 Logs 確認服務正常啟動

---

## 🚀 部署後測試

訪問部署 URL（如：`https://lva.angelslab.io/`）並測試：

1. ✅ 主頁面可以訪問
2. ✅ 文字對話功能正常
3. ✅ 語音對話功能正常
4. ✅ 管理後台可以訪問

如果所有功能正常，說明環境變數配置完整！

