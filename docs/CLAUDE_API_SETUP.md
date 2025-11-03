# Claude API 設定指南

## 概述

花小軟現在支持使用 **Claude API** 或 **OpenAI API** 作為 LLM 提供商。

## 環境變數設定

在 `.env` 文件中添加以下配置：

```env
# LLM 提供商選擇（"claude" 或 "openai"）
LLM_PROVIDER=claude

# Claude API 設定
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# OpenAI API 設定（備用）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

## 可用的 Claude 模型

- `claude-3-5-sonnet-20241022`（推薦，最新版本）
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

## 切換提供商

### 使用 Claude（預設）

```env
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=your_key_here
```

### 使用 OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

## 功能對比

| 功能 | Claude | OpenAI |
|------|--------|--------|
| 基本對話 | ✅ | ✅ |
| 情緒標籤選擇（工具調用） | ✅ | ✅ |
| 系統提示詞 | ✅（使用 `system` 參數） | ✅（使用 `system` role） |
| 對話歷史 | ✅ | ✅ |
| 記憶新鮮化 | ✅ | ✅ |

## 技術實現差異

### Claude API
- 使用 `@anthropic-ai/sdk`
- 系統提示詞作為獨立的 `system` 參數
- 工具調用格式：`tool_use` 和 `tool_result`
- 消息格式：`[{ role, content }]`（content 可以是字符串或內容塊數組）

### OpenAI API
- 使用 `openai` SDK
- 系統提示詞作為 `role: "system"` 的消息
- 工具調用格式：`tool_calls` 和 `tool` role
- 消息格式：`[{ role, content }]`（content 是字符串）

## 測試

1. 確保 `.env` 中設置了 `ANTHROPIC_API_KEY`
2. 啟動服務器：`npm start`
3. 訪問 `http://localhost:3000`
4. 測試對話，觀察日誌中的 Claude 初始化訊息

## 故障排除

### Claude 客戶端未初始化
- 檢查 `ANTHROPIC_API_KEY` 是否正確設置
- 確認 `@anthropic-ai/sdk` 已安裝：`npm install @anthropic-ai/sdk`

### 工具調用失敗
- Claude 的工具調用格式與 OpenAI 不同，已自動處理
- 如果仍有問題，檢查日誌中的錯誤訊息

## 切換回 OpenAI

如果遇到問題，可以隨時切換回 OpenAI：

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

---

**花小軟現在支持 Claude 了！** 🎉🌸

