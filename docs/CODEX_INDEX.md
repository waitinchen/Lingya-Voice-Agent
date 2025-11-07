# 📑 CODEX 文檔索引

## 🎯 快速開始

**如果你是 CODEX，請按以下順序閱讀：**

### 第一步：項目切換（必須先完成）

1. **`CODEX_START_HERE.md`** ⭐ **最先閱讀**
   - 位置：項目根目錄
   - 內容：三步快速切換指南
   - 用途：快速了解如何切換項目

2. **`CODEX_README.md`**（可選，需要詳細說明時）
   - 位置：項目根目錄
   - 內容：完整切換指南、項目結構對比
   - 用途：深入了解切換步驟

### 第二步：驗證切換成功（必須全部通過）

```bash
# 切換項目
cd /path/to/Lingya_Voice_Agent

# 驗證步驟（必須全部通過）
cat package.json | grep "lingya-voice-agent"  # ✅ 必須匹配
ls docs/ modules/ public/                      # ✅ 必須全部存在
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws  # ✅ 必須看到依賴
```

### 第三步：執行檢查（切換成功後）

3. **`docs/DEBUG_CHECKLIST.md`**
   - 位置：`docs/` 目錄
   - 內容：完整檢查清單
   - 用途：系統性檢查和除錯

4. **`docs/QUICK_DEBUG_GUIDE.md`**
   - 位置：`docs/` 目錄
   - 內容：快速除錯指南
   - 用途：快速問題排查

## 📚 完整文檔列表

### 項目根目錄

| 文檔 | 用途 | 優先級 |
|------|------|--------|
| `CODEX_START_HERE.md` | 三步快速切換指南 | ⭐⭐⭐ 最高 |
| `CODEX_README.md` | 完整切換說明 | ⭐⭐ 高 |

### docs/ 目錄

| 文檔 | 用途 | 何時使用 |
|------|------|----------|
| `CODEX_INSTRUCTIONS.md` | 給 CODEX 的明確指令 | 需要明確執行步驟時 |
| `CODEX_PROJECT_PATH.md` | 路徑詳解與對比表 | 需要了解項目結構時 |
| `CODEX_FINAL_CHECKLIST.md` | 最終檢查清單 | 切換後驗證時 |
| `CODEX_DOCUMENTATION_SUMMARY.md` | 文檔總覽 | 需要了解所有文檔時 |
| `DEBUG_CHECKLIST.md` | 完整檢查清單 | 切換成功後執行檢查 |
| `QUICK_DEBUG_GUIDE.md` | 快速除錯指南 | 需要快速排查問題時 |

## ✅ 切換成功驗證清單

切換到 `Lingya_Voice_Agent` 後，必須同時滿足：

- [ ] `cat package.json | grep "lingya-voice-agent"` 有匹配
- [ ] `ls docs/ modules/ public/` 全部目錄存在
- [ ] `npm list @anthropic-ai/sdk` 依賴已安裝
- [ ] `npm list @cartesia/cartesia-js` 依賴已安裝
- [ ] `npm list express-ws` 依賴已安裝

## ⚠️ 錯誤標誌

如果看到以下情況，表示**還沒切換**：

- ❌ 當前目錄是 `soft-voice-mvp/backend/`
- ❌ 只有 `backend/package.json`，沒有 `docs/` 或 `modules/`
- ❌ `package.json` 中沒有 `@anthropic-ai/sdk`
- ❌ `.env` 中沒有 `ANTHROPIC_API_KEY`

**解決方案：** 回到第一步，閱讀 `CODEX_START_HERE.md`

## 🚀 快速命令參考

### 切換項目
```bash
cd /path/to/Lingya_Voice_Agent
```

### 驗證切換
```bash
cat package.json | grep "lingya-voice-agent" && \
ls docs/ modules/ public/ && \
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws && \
echo "✅ 項目切換成功"
```

### 開始檢查
```bash
cat docs/DEBUG_CHECKLIST.md
```

## 📖 閱讀路徑圖

```
開始
 ↓
CODEX_START_HERE.md（根目錄）
 ↓
切換項目
 ↓
驗證成功？
 ├─ 是 → docs/DEBUG_CHECKLIST.md
 └─ 否 → CODEX_README.md（詳細說明）
```

## 🔗 相關文檔

- `README.md` - 項目總體說明
- `docs/DEBUGGING_GUIDE.md` - 通用除錯指南
- `docs/CODE_STATUS_REPORT.md` - 代碼狀態報告

---

**最後更新：** 2025-01-XX  
**狀態：** ✅ 所有文檔已準備就緒

