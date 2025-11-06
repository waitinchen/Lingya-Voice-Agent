# Bug 修复：abortSignal/signal 错误

## 问题描述

页面上出现错误：
```
抱歉，發生錯誤：400 {"type":"error","error":{"type":"invalid_request_error","message":"signal: Extra inputs are not permitted"},"request_id":"req_011CUrQ6BpaPbgNnLqJ7qrH3"} 😅
```

之前的错误（已修复）：
```
抱歉，發生錯誤：400 {"type":"error","error":{"type":"invalid_request_error","message":"abortSignal: Extra inputs are not permitted"},"request_id":"req_011CUqjxgFDhqPbe2aW96nBk"} 😅
```

## 根本原因

Anthropic SDK 的 `messages.stream()` 方法**不支持** `signal` 或 `abortSignal` 参数。这与 OpenAI SDK 不同，OpenAI SDK 支持 `signal` 参数用于请求中止。

## 修复方案

### 修复位置
- **文件**: `modules/llm-stream.js`
- **行数**: 239, 294

### 修复内容

**修复前（错误）**:
```javascript
const stream = await anthropicClient.messages.stream({
  model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
  max_tokens: 300,
  temperature: temperature,
  system: systemPrompt,
  messages: conversationMessages,
  signal: abortSignal, // ❌ 错误：Anthropic SDK 不支持 signal 参数
});
```

**修复后（正确）**:
```javascript
const stream = await anthropicClient.messages.stream({
  model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
  max_tokens: 300,
  temperature: temperature,
  system: systemPrompt,
  messages: conversationMessages,
  // 注意：Anthropic SDK 不支持 signal 参数，需要在循环中检查 abortSignal
});

for await (const event of stream) {
  // 檢查是否被中止（Anthropic SDK 不支持 signal 参数，所以在这里检查）
  if (abortSignal && abortSignal.aborted) {
    console.log("⏹️  LLM 流式處理被中止");
    // 尝试中止流（如果支持）
    if (typeof stream.abort === 'function') {
      stream.abort();
    }
    throw new Error("LLM stream aborted");
  }
  // ... 处理事件
}
```

## 提交记录

- **提交 1**: `6d654e9` - fix(llm-stream): 修复 Claude API 参数错误（从 abortSignal 改为 signal）
- **提交 2**: `daf48d0` - fix: remove unsupported signal parameter from Anthropic SDK messages.stream
- **状态**: 已修复并推送到仓库

## 重要说明

- **Anthropic SDK** (`@anthropic-ai/sdk`) 的 `messages.stream()` **不支持** `signal` 或 `abortSignal` 参数
- **OpenAI SDK** (`openai`) 的 `chat.completions.create()` **支持** `signal` 参数
- 对于 Anthropic SDK，需要在循环中手动检查 `abortSignal.aborted` 来实现中止功能

## 后续修复

### 修复 "Request was aborted" 错误

**问题**：用户看到错误消息 "Request was aborted"

**原因**：当请求被中止时，Anthropic SDK 可能抛出 "Request was aborted" 错误，这个错误被传播到前端显示给用户。

**修复方案**：
1. 在请求开始前检查 `abortSignal.aborted`，避免不必要的请求
2. 在错误处理中识别 "Request was aborted" 错误，不向用户显示
3. 统一处理所有中止相关的错误消息

**提交记录**：
- `0227e60` - fix: handle 'Request was aborted' error gracefully without showing to user

## 验证步骤

1. 等待部署完成（Railway 自动部署）
2. 刷新页面 `https://lva.angelslab.io/`
3. 发送测试消息
4. 确认不再出现以下错误：
   - `abortSignal: Extra inputs are not permitted`
   - `signal: Extra inputs are not permitted`
   - `Request was aborted`（现在会静默处理，不显示给用户）

## 相关文件

- `modules/llm-stream.js` - LLM 流式处理模块
- `modules/websocket-voice.js` - WebSocket 语音服务（调用 llm-stream.js）

## 注意事项

- `websocket-voice.js` 中调用 `chatWithLLMStream` 时传递 `abortSignal: abortSignal` 是正确的，因为这是传递给函数的 options 对象
- `chatWithLLMStream` 函数内部会根据 LLM 提供商（Claude 或 OpenAI）采用不同的中止策略：
  - **Claude**: 在循环中检查 `abortSignal.aborted`（因为不支持 `signal` 参数）
  - **OpenAI**: 使用 `signal: abortSignal` 参数（支持原生中止）

