# 📍 CODEX 項目路徑說明

## ⚠️ 重要：項目路徑確認

**DEBUG_CHECKLIST.md 是針對 `Lingya_Voice_Agent` 項目，不是 `soft-voice-mvp` 項目！**

## 🔍 如何確認正確的項目

### 方法 1: 檢查項目結構

**正確的項目（Lingya_Voice_Agent）應該有：**
```
Lingya_Voice_Agent/
├── docs/              ✅ 存在
├── modules/           ✅ 存在
│   ├── llm-stream.js
│   ├── websocket-voice.js
│   ├── tts-cartesia.js
│   └── ...
├── public/
│   └── index.html
├── server.js
└── package.json       ✅ 包含 @anthropic-ai/sdk, express-ws 等
```

**錯誤的項目（soft-voice-mvp）會有：**
```
soft-voice-mvp/
└── backend/
    ├── package.json   ❌ 只有 express, openai, multer
    └── .env           ❌ 沒有 ANTHROPIC_API_KEY
```

### 方法 2: 檢查 package.json

**正確的項目 package.json 應該包含：**
```json
{
  "name": "lingya-voice-agent",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.68.0",      ✅
    "@cartesia/cartesia-js": "^2.2.7",   ✅
    "express-ws": "^5.0.2",              ✅
    "openai": "^4.104.0",
    ...
  }
}
```

### 方法 3: 檢查環境變數

**正確的項目 .env 應該包含：**
```env
ANTHROPIC_API_KEY=sk-ant-...     ✅ 必須有
OPENAI_API_KEY=sk-...            ✅ 必須有
CARTESIA_API_KEY=...             ✅ 必須有
LLM_PROVIDER=claude              ✅ 必須有
CLAUDE_MODEL=claude-3-5-sonnet-20241022  ✅ 必須有
```

## 🛠️ 如果 CODEX 在錯誤的項目中

### 情況 1: 需要檢查 Lingya_Voice_Agent 項目

**解決方案：**
1. 切換到正確的項目目錄：
   ```bash
   cd /path/to/Lingya_Voice_Agent
   # 或
   cd C:\Users\waiti\Lingya_Voice_Agent
   ```

2. 確認項目結構：
   ```bash
   ls docs/ modules/ public/
   # 應該看到這些目錄存在
   ```

3. 檢查 package.json：
   ```bash
   cat package.json | grep "@anthropic-ai/sdk"
   # 應該看到依賴存在
   ```

### 情況 2: 需要在 soft-voice-mvp 中導入黃蓉功能

**這需要：**
1. 安裝依賴：
   ```bash
   cd soft-voice-mvp/backend
   npm install @anthropic-ai/sdk @cartesia/cartesia-js express-ws
   ```

2. 添加環境變數到 `.env`：
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   LLM_PROVIDER=claude
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```

3. 複製相關模組（從 Lingya_Voice_Agent）：
   - `modules/llm-stream.js`
   - `modules/websocket-voice.js`
   - `modules/tts-cartesia.js`
   - 等等...

## 📋 快速檢查命令

### 在正確的項目中執行：

```bash
# 1. 確認項目名稱
cat package.json | grep "name"

# 2. 確認依賴
npm list @anthropic-ai/sdk @cartesia/cartesia-js express-ws

# 3. 確認目錄結構
ls -la docs/ modules/ public/

# 4. 確認環境變數
grep -E "ANTHROPIC_API_KEY|LLM_PROVIDER" .env
```

## 🎯 推薦做法

**給 CODEX 的指令：**

```
請確認當前工作目錄是否為 Lingya_Voice_Agent 項目。

檢查方法：
1. 執行：cat package.json | grep "lingya-voice-agent"
2. 如果找不到，請切換到正確的項目目錄
3. 確認有 docs/ 和 modules/ 目錄
4. 然後再執行 DEBUG_CHECKLIST.md 中的檢查步驟
```

## 📝 項目對比表

| 項目 | 路徑 | 有 docs/ | 有 modules/ | 有 @anthropic-ai/sdk | 用途 |
|------|------|----------|-------------|---------------------|------|
| **Lingya_Voice_Agent** | `Lingya_Voice_Agent/` | ✅ | ✅ | ✅ | 黃蓉語音助手（完整版） |
| **soft-voice-mvp** | `soft-voice-mvp/backend/` | ❌ | ❌ | ❌ | 語氣靈 MVP（基礎版） |

## ⚠️ 注意事項

1. **DEBUG_CHECKLIST.md 只適用於 Lingya_Voice_Agent 項目**
2. **如果 CODEX 在 soft-voice-mvp 中，需要先切換項目或導入功能**
3. **兩個項目的結構和依賴完全不同**

## 🔗 相關文檔

- `docs/DEBUG_CHECKLIST.md` - 詳細檢查清單（僅適用於 Lingya_Voice_Agent）
- `docs/QUICK_DEBUG_GUIDE.md` - 快速除錯指南
- `README.md` - 項目說明

---

**最後更新：** 2025-01-XX
**適用項目：** Lingya_Voice_Agent

