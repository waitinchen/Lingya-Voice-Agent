# ✅ CODEX 最終檢查清單

## 📋 文檔確認

所有項目切換文檔已準備就緒：

- [x] **`CODEX_START_HERE.md`** - 項目根目錄，三步切換指南（首要閱讀）
- [x] **`CODEX_README.md`** - 項目根目錄，完整切換說明
- [x] **`docs/CODEX_INSTRUCTIONS.md`** - 給 CODEX 的明確執行指令
- [x] **`docs/CODEX_PROJECT_PATH.md`** - 路徑詳解與對比表
- [x] **`docs/DEBUG_CHECKLIST.md`** - 已加註項目路徑確認
- [x] **`docs/QUICK_DEBUG_GUIDE.md`** - 已加註項目路徑驗證

## 🎯 給 CODEX 的直接指令

### 步驟 1: 切換項目
```bash
cd /path/to/Lingya_Voice_Agent
# Windows 範例：
cd C:\Users\waiti\Lingya_Voice_Agent
```

### 步驟 2: 驗證切換成功（必須全部通過）

```bash
# ✅ 必須匹配 "lingya-voice-agent"
cat package.json | grep "lingya-voice-agent"

# ✅ 必須全部存在
ls docs/ modules/ public/

# ✅ 必須看到依賴已安裝
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws
```

### 步驟 3: 執行檢查
```bash
# 查看完整檢查清單
cat docs/DEBUG_CHECKLIST.md

# 或快速指南
cat docs/QUICK_DEBUG_GUIDE.md
```

## ⚠️ 錯誤標誌

如果看到以下情況，表示**還沒切換**：

- ❌ 當前目錄是 `soft-voice-mvp/backend/`
- ❌ 只有 `backend/package.json`，沒有 `docs/` 或 `modules/`
- ❌ `package.json` 中沒有 `@anthropic-ai/sdk`
- ❌ `.env` 中沒有 `ANTHROPIC_API_KEY`

**解決方案：** 依 `CODEX_START_HERE.md` 或 `CODEX_README.md` 的指引切換項目

## ✅ 成功標誌

切換成功後，應該看到：

- ✅ `package.json` 包含 `"name": "lingya-voice-agent"`
- ✅ `docs/` 目錄存在且包含多個文檔
- ✅ `modules/` 目錄存在且包含多個模組
- ✅ `public/` 目錄存在且包含 `index.html`
- ✅ `package.json` 包含 `@anthropic-ai/sdk`, `express-ws` 等依賴
- ✅ `.env` 包含 `ANTHROPIC_API_KEY`, `LLM_PROVIDER`, `CLAUDE_MODEL` 等

## 📚 文檔閱讀順序

1. **`CODEX_START_HERE.md`** ← 最先看這個（最簡潔）
2. **`CODEX_README.md`** ← 需要詳細說明時看這個
3. **`docs/CODEX_INSTRUCTIONS.md`** ← 需要明確指令時看這個
4. **`docs/DEBUG_CHECKLIST.md`** ← 切換成功後執行檢查

## 🔍 快速驗證命令

```bash
# 一行命令驗證所有必要條件
cat package.json | grep "lingya-voice-agent" && \
ls docs/ modules/ public/ && \
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws 2>/dev/null && \
echo "✅ 項目切換成功，可以執行檢查清單"
```

## 📝 注意事項

1. **必須在 `Lingya_Voice_Agent` 項目中才能執行檢查**
2. **`soft-voice-mvp` 是另一個項目，結構完全不同**
3. **所有檢查清單都假設在正確的項目中執行**
4. **如果無法切換，請詢問用戶項目的實際路徑**

---

**最後更新：** 2025-01-XX  
**狀態：** ✅ 所有文檔已準備就緒

