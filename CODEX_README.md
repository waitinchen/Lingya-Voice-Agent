# 🔄 CODEX 項目切換指南

## ⚠️ 重要提示

**如果你目前在 `soft-voice-mvp` 項目中，請先切換到 `Lingya_Voice_Agent` 項目！**

## 🎯 當前情況

- ❌ **錯誤位置**：`soft-voice-mvp/backend/` 
  - 沒有 `docs/` 目錄
  - 沒有 `modules/` 目錄
  - 沒有 `@anthropic-ai/sdk` 依賴
  - 這是**語氣靈 MVP**（基礎版）

- ✅ **正確位置**：`Lingya_Voice_Agent/`
  - 有完整的 `docs/` 目錄
  - 有完整的 `modules/` 目錄
  - 有 `@anthropic-ai/sdk` 等所有依賴
  - 這是**黃蓉語音助手**（完整版）

## 🚀 快速切換步驟

### 步驟 1: 確認當前位置
```bash
# 檢查當前目錄
pwd
# 或
cd

# 檢查項目名稱
cat package.json | grep "name"
```

### 步驟 2: 切換到正確項目
```bash
# 方法 1: 如果知道完整路徑
cd /path/to/Lingya_Voice_Agent
# Windows 範例：
cd C:\Users\waiti\Lingya_Voice_Agent

# 方法 2: 從 soft-voice-mvp 切換
cd ../Lingya_Voice_Agent
# 或
cd ../../Lingya_Voice_Agent
```

### 步驟 3: 驗證切換成功
```bash
# 檢查項目名稱（應該看到 "lingya-voice-agent"）
cat package.json | grep "name"

# 檢查目錄結構（應該存在）
ls docs/ modules/ public/

# 檢查依賴（應該已安裝）
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws
```

## 📋 項目結構對比

### ✅ Lingya_Voice_Agent（正確項目）
```
Lingya_Voice_Agent/
├── docs/                    ✅ 存在
│   ├── DEBUG_CHECKLIST.md
│   ├── CODEX_PROJECT_PATH.md
│   └── ...
├── modules/                 ✅ 存在
│   ├── llm-stream.js
│   ├── websocket-voice.js
│   ├── tts-cartesia.js
│   └── ...
├── public/                  ✅ 存在
│   └── index.html
├── server.js                ✅ 存在
├── package.json             ✅ 包含所有依賴
└── .env                     ✅ 包含 ANTHROPIC_API_KEY
```

### ❌ soft-voice-mvp（錯誤項目）
```
soft-voice-mvp/
└── backend/
    ├── package.json         ❌ 只有基礎依賴
    └── .env                 ❌ 沒有 ANTHROPIC_API_KEY
```

## 🔍 檢查清單（切換後執行）

切換到 `Lingya_Voice_Agent` 後，請執行：

1. **環境變數檢查**
   ```bash
   cat .env | grep -E "ANTHROPIC_API_KEY|LLM_PROVIDER|CLAUDE_MODEL"
   ```

2. **依賴檢查**
   ```bash
   npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws
   ```

3. **目錄結構檢查**
   ```bash
   ls -la docs/ modules/ public/
   ```

4. **執行完整檢查清單**
   ```bash
   # 查看檢查清單
   cat docs/DEBUG_CHECKLIST.md
   ```

## 📚 相關文檔

切換到正確項目後，請查看：

- `docs/DEBUG_CHECKLIST.md` - 完整檢查清單
- `docs/QUICK_DEBUG_GUIDE.md` - 快速除錯指南
- `docs/CODEX_PROJECT_PATH.md` - 詳細項目路徑說明

## ⚠️ 如果無法切換

如果無法切換到 `Lingya_Voice_Agent` 項目，可能的原因：

1. **項目不存在** - 需要先克隆或下載項目
2. **路徑錯誤** - 確認項目的實際路徑
3. **權限問題** - 確認有訪問權限

**解決方案：**
- 詢問用戶項目的實際路徑
- 確認項目是否已克隆到本地
- 檢查文件系統權限

## 🎯 總結

**必須在 `Lingya_Voice_Agent` 項目中才能執行檢查清單！**

**切換命令：**
```bash
cd /path/to/Lingya_Voice_Agent
# 然後執行檢查
```

---

**最後更新：** 2025-01-XX
**適用於：** CODEX 本地開發團隊

