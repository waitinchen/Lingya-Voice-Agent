# 📚 CODEX 文檔總覽

## ✅ 文檔狀態：全部就緒

所有項目切換和檢查文檔已準備完成，結構如下：

## 📁 文檔結構

### 項目根目錄（優先閱讀）

1. **`CODEX_START_HERE.md`** ⭐ **最先閱讀**
   - 三步快速切換指南
   - 成功標誌檢查
   - 最簡潔的說明

2. **`CODEX_README.md`**
   - 完整切換指南
   - 項目結構對比
   - 詳細步驟說明

### docs/ 目錄

3. **`docs/CODEX_INSTRUCTIONS.md`**
   - 給 CODEX 的明確執行指令
   - 立即執行步驟
   - 參考文檔連結

4. **`docs/CODEX_PROJECT_PATH.md`**
   - 路徑詳解與對比表
   - 如何確認正確項目
   - 項目對比說明

5. **`docs/CODEX_FINAL_CHECKLIST.md`**
   - 最終檢查清單
   - 驗證命令
   - 成功/失敗標誌

### 檢查清單（切換後使用）

6. **`docs/DEBUG_CHECKLIST.md`** ✅ 已加註項目路徑確認
   - 完整檢查清單
   - 環境配置檢查
   - 代碼問題檢查
   - 功能測試檢查
   - 常見問題排查

7. **`docs/QUICK_DEBUG_GUIDE.md`** ✅ 已加註項目路徑驗證
   - 快速除錯指南
   - 5分鐘快速檢查
   - 常見問題快速修復

## 🎯 給 CODEX 的直接指令

### 必須執行的步驟

```bash
# 步驟 1: 切換項目
cd /path/to/Lingya_Voice_Agent

# 步驟 2: 驗證切換成功（必須全部通過）
cat package.json | grep "lingya-voice-agent"  # 必須匹配
ls docs/ modules/ public/                      # 必須全部存在
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws  # 必須看到依賴

# 步驟 3: 執行檢查
cat docs/DEBUG_CHECKLIST.md
```

## ⚠️ 錯誤標誌

如果仍在 `soft-voice-mvp` 中，會看到：
- ❌ 只有 `backend/package.json`
- ❌ 沒有 `docs/` 或 `modules/` 目錄
- ❌ `package.json` 中沒有 `@anthropic-ai/sdk`

**解決方案：** 依 `CODEX_START_HERE.md` 指引切換項目

## ✅ 成功標誌

切換成功後，應該看到：
- ✅ `package.json` 包含 `"name": "lingya-voice-agent"`
- ✅ `docs/` 目錄存在（包含多個文檔）
- ✅ `modules/` 目錄存在（包含多個模組）
- ✅ `public/` 目錄存在（包含 `index.html`）
- ✅ `package.json` 包含所需依賴
- ✅ `.env` 包含 `ANTHROPIC_API_KEY` 等變數

## 📖 閱讀順序建議

1. **`CODEX_START_HERE.md`** ← 最先看（最簡潔）
2. **`CODEX_README.md`** ← 需要詳細說明時
3. **`docs/CODEX_INSTRUCTIONS.md`** ← 需要明確指令時
4. **`docs/DEBUG_CHECKLIST.md`** ← 切換成功後執行檢查

## 🔍 快速驗證

```bash
# 一行命令驗證所有必要條件
cat package.json | grep "lingya-voice-agent" && \
ls docs/ modules/ public/ && \
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws 2>/dev/null && \
echo "✅ 項目切換成功，可以執行檢查清單"
```

## 📝 注意事項

1. **所有檢查清單僅適用於 `Lingya_Voice_Agent` 項目**
2. **`soft-voice-mvp` 是另一個項目，結構完全不同**
3. **必須先切換項目，再執行檢查**
4. **如果無法切換，請詢問用戶項目的實際路徑**

---

**狀態：** ✅ 所有文檔已準備就緒  
**最後更新：** 2025-01-XX

