# 📡 WebRTC + WebSocket 实时语音通话实施计划

**版本**: v0.1  
**目标**: 实现黄蓉语气灵的实时双向语音通话功能

---

## 🎯 实施目标

### Phase 1: 实时音频流传输 ✅ (部分完成)
- [x] WebSocket 音频 chunk 传输
- [x] MediaRecorder 音频捕获
- [ ] **改进**: 使用 AudioContext 实时处理（更高效）

### Phase 2: 增量 STT 🔄 (进行中)
- [ ] 实现增量语音识别
- [ ] 实时发送 `transcription_partial` 消息
- [ ] 优化音频缓冲和合并

### Phase 3: 实时 TTS 回传 ✅ (基本完成)
- [x] TTS 流式生成
- [x] WebSocket 音频片段回传
- [x] 前端实时播放

### Phase 4: 完整集成 🔄
- [ ] 优化延迟
- [ ] 错误恢复机制
- [ ] 性能监控

---

## 🏗️ 技术架构

### 当前架构
```
[前端]
MediaRecorder (100ms chunks)
  ↓ WebSocket
[后端]
合并 chunks → STT → LLM → TTS → 回传
```

### 目标架构（更实时）
```
[前端]
AudioContext → ScriptProcessor (实时)
  ↓ WebSocket (更小 chunks)
[后端]
增量 STT → 实时 LLM → 流式 TTS → 实时回传
```

---

## 📦 模块结构

### 新增模块

1. **`modules/audio-stream-processor.js`**
   - 实时音频流处理（基于 AudioContext）
   - 替代 MediaRecorder 实现更低的延迟

2. **`modules/incremental-stt.js`**
   - 增量 STT 处理
   - 音频缓冲管理
   - 实时转录结果发送

3. **`public/realtime-call.html`**
   - 实时通话测试页面
   - 简化的 UI（录音按钮 + 播放区域）

### 改进现有模块

1. **`modules/websocket-voice.js`**
   - 添加增量 STT 支持
   - 优化音频 chunk 处理
   - 实时 `transcription_partial` 消息

2. **`public/index.html`**
   - 添加实时音频流模式选项
   - 优化音频播放（实时缓冲）

---

## 🔧 实施步骤

### Step 1: 创建实时音频流处理器
创建 `modules/audio-stream-processor.js`，使用 AudioContext API 实现更实时的音频捕获。

### Step 2: 实现增量 STT 支持
改进 `modules/websocket-voice.js`，支持实时音频识别和增量转录。

### Step 3: 优化前端音频处理
更新 `public/index.html`，添加实时音频流模式。

### Step 4: 创建测试页面
创建 `public/realtime-call.html` 用于测试实时通话功能。

---

## 📝 技术细节

### 音频格式
- **输入**: PCM (16-bit, 16kHz, mono)
- **传输**: Base64 编码的 PCM 数据
- **输出**: WAV/WebM 格式的 TTS 音频

### 延迟优化
- **音频 chunk 大小**: 200-400ms
- **STT 处理**: 每 1-2 秒触发一次
- **TTS 流式**: 实时生成和播放

### 错误处理
- WebSocket 断线重连
- 音频流中断恢复
- STT/TTS 失败降级

---

## 🧪 测试计划

1. **单元测试**
   - 音频流处理器
   - 增量 STT 模块
   - WebSocket 消息处理

2. **集成测试**
   - 完整语音通话流程
   - 延迟测试
   - 错误恢复测试

3. **性能测试**
   - 内存使用
   - CPU 使用
   - 网络带宽

---

## 📚 参考资料

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
- [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

