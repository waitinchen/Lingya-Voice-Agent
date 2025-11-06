# 📋 給 CODEX 的明確指令

## 🎯 當前任務

**你目前在錯誤的項目中！需要切換到正確的項目才能執行檢查。**

## ⚠️ 問題說明

- **當前位置**：`soft-voice-mvp/backend/` ❌
- **需要位置**：`Lingya_Voice_Agent/` ✅

## 🚀 立即執行步驟

### 步驟 1: 切換項目
```bash
# 切換到正確的項目目錄
cd /path/to/Lingya_Voice_Agent

# Windows 範例（根據實際路徑調整）：
cd C:\Users\waiti\Lingya_Voice_Agent
```

### 步驟 2: 驗證切換成功
```bash
# 檢查項目名稱
cat package.json | grep "name"
# 應該輸出: "name": "lingya-voice-agent"

# 檢查目錄是否存在
ls docs/ modules/ public/
# 應該看到這些目錄

# 檢查依賴
npm list @anthropic-ai/sdk
# 應該看到依賴已安裝
```

### 步驟 3: 執行檢查
```bash
# 查看檢查清單
cat docs/DEBUG_CHECKLIST.md

# 或查看快速指南
cat docs/QUICK_DEBUG_GUIDE.md
```

## 📚 參考文檔

切換後，請查看以下文檔：

1. **`CODEX_README.md`** - 項目切換詳細指南（項目根目錄）
2. **`docs/CODEX_PROJECT_PATH.md`** - 項目路徑說明
3. **`docs/DEBUG_CHECKLIST.md`** - 完整檢查清單
4. **`docs/QUICK_DEBUG_GUIDE.md`** - 快速除錯指南

## ❓ 如果無法切換

**請詢問用戶：**
1. `Lingya_Voice_Agent` 項目的實際路徑是什麼？
2. 項目是否已克隆到本地？
3. 如果沒有，需要先克隆項目嗎？

## ✅ 成功標誌

切換成功後，你應該能看到：
- ✅ `docs/` 目錄存在
- ✅ `modules/` 目錄存在
- ✅ `package.json` 包含 `@anthropic-ai/sdk`
- ✅ `.env` 文件包含 `ANTHROPIC_API_KEY`

---

**重要：只有在 `Lingya_Voice_Agent` 項目中才能執行檢查清單！**

