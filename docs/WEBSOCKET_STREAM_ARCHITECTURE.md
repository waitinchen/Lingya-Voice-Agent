# 🚀 WebSocket 雙向語音串流架構設計

**版本：** v1.0  
**目標：** 從 request/response 式升級為 voice pipeline 流模式  
**狀態：** 📋 規劃中

---

## 📌 概述

建立雙向語音回合架構，實現低延遲的實時語音對話。從現有的 HTTP POST `/api/voice-chat` 升級為 WebSocket 串流模式，支持：

- ✅ 實時音頻流傳輸（雙向）
- ✅ 增量語音識別（VAD + 流式 STT）
- ✅ 流式 LLM 回應（SSE-like）
- ✅ 流式 TTS 播放（邊生成邊播放）
- ✅ 狀態同步（連接狀態、錯誤處理）
- ✅ 對話上下文管理

---

## 🏗️ 系統架構

### 當前架構（Request/Response）

```
用戶錄音完成
    ↓
HTTP POST /api/voice-chat (完整音頻)
    ↓
等待完整 STT → LLM → TTS
    ↓
返回完整回應（文字 + 音頻）
```

**問題：**
- ❌ 高延遲（需等待完整流程）
- ❌ 無法實時反饋
- ❌ 無法打斷（interrupt）
- ❌ 無法處理長對話

### 新架構（WebSocket Pipeline）

```
WebSocket 連接建立
    ↓
用戶開始說話 → 音頻片段流式傳輸
    ↓
實時 STT（增量識別）→ 顯示轉文字
    ↓
VAD 檢測停止 → 觸發 LLM
    ↓
流式 LLM 回應 → 顯示文字流
    ↓
流式 TTS → 邊生成邊播放
    ↓
支持打斷（interrupt）機制
```

**優勢：**
- ✅ 低延遲（實時反饋）
- ✅ 可視化進度（STT、LLM、TTS 狀態）
- ✅ 支持打斷
- ✅ 更好的用戶體驗

---

## 📡 WebSocket 協議設計

### 連接端點

```
ws://localhost:3000/api/voice-ws
wss://lva.angelslab.io/api/voice-ws (生產環境)
```

### 消息格式

所有消息使用 JSON 格式：

```typescript
interface WSMessage {
  type: string;        // 消息類型
  id?: string;         // 消息 ID（用於追蹤）
  timestamp?: number;  // 時間戳
  data?: any;          // 消息數據
  error?: string;      // 錯誤信息
}
```

---

## 📤 客戶端 → 服務端消息

### 1. `connect` - 建立連接並初始化

```json
{
  "type": "connect",
  "data": {
    "language": "zh",
    "userIdentity": "dad",
    "userName": "陳威廷",
    "sessionId": "optional-session-id"
  }
}
```

**回應：**
```json
{
  "type": "connected",
  "data": {
    "sessionId": "generated-session-id",
    "status": "ready"
  }
}
```

### 2. `audio_chunk` - 發送音頻片段

```json
{
  "type": "audio_chunk",
  "id": "chunk-123",
  "data": {
    "audio": "base64-encoded-audio-chunk",
    "format": "webm",  // webm, pcm, wav
    "sampleRate": 44100,
    "channels": 1
  }
}
```

**回應：**
```json
{
  "type": "transcription_partial",
  "id": "chunk-123",
  "data": {
    "text": "你好",
    "isFinal": false
  }
}
```

或最終結果：
```json
{
  "type": "transcription_final",
  "id": "chunk-123",
  "data": {
    "text": "你好，我想問一個問題",
    "confidence": 0.95
  }
}
```

### 3. `audio_end` - 標記音頻輸入結束

```json
{
  "type": "audio_end",
  "data": {
    "finalize": true
  }
}
```

**觸發：**
- VAD 檢測到靜音
- 用戶手動停止錄音
- 自動觸發 LLM 處理

### 4. `interrupt` - 打斷當前回應

```json
{
  "type": "interrupt",
  "data": {
    "reason": "user_stopped"  // user_stopped, new_input
  }
}
```

**效果：**
- 停止當前 TTS 生成
- 停止當前 LLM 流式輸出
- 準備接收新輸入

### 5. `reset` - 重置對話上下文

```json
{
  "type": "reset",
  "data": {
    "clearHistory": true
  }
}
```

### 6. `ping` - 心跳檢測

```json
{
  "type": "ping",
  "timestamp": 1234567890
}
```

**回應：**
```json
{
  "type": "pong",
  "timestamp": 1234567890
}
```

---

## 📥 服務端 → 客戶端消息

### 1. `connected` - 連接成功

```json
{
  "type": "connected",
  "data": {
    "sessionId": "session-123",
    "status": "ready",
    "capabilities": {
      "streaming": true,
      "interrupt": true,
      "vad": true
    }
  }
}
```

### 2. `transcription_partial` - 增量語音識別

```json
{
  "type": "transcription_partial",
  "id": "chunk-123",
  "data": {
    "text": "你好",
    "isFinal": false
  }
}
```

### 3. `transcription_final` - 最終語音識別

```json
{
  "type": "transcription_final",
  "id": "chunk-123",
  "data": {
    "text": "你好，我想問一個問題",
    "confidence": 0.95,
    "emotion": "開心"
  }
}
```

### 4. `llm_stream_start` - LLM 開始生成

```json
{
  "type": "llm_stream_start",
  "data": {
    "status": "thinking"
  }
}
```

### 5. `llm_stream_chunk` - LLM 增量文字輸出

```json
{
  "type": "llm_stream_chunk",
  "data": {
    "text": "你好",
    "delta": "你好",  // 本次增量
    "fullText": "你好，我是黃蓉",
    "tags": ["warm", "playful"]
  }
}
```

### 6. `llm_stream_end` - LLM 生成完成

```json
{
  "type": "llm_stream_end",
  "data": {
    "fullText": "你好，我是黃蓉，很高興認識你～",
    "tags": ["warm", "playful"],
    "toneTag": {
      "emoji": "💞",
      "label": "溫柔"
    },
    "emotion": "開心"
  }
}
```

### 7. `tts_stream_start` - TTS 開始生成

```json
{
  "type": "tts_stream_start",
  "data": {
    "status": "synthesizing",
    "estimatedDuration": 3000  // 毫秒
  }
}
```

### 8. `tts_stream_chunk` - TTS 音頻片段

```json
{
  "type": "tts_stream_chunk",
  "data": {
    "audio": "base64-encoded-audio-chunk",
    "format": "wav",
    "sequence": 1,  // 片段序號
    "isLast": false
  }
}
```

### 9. `tts_stream_end` - TTS 生成完成

```json
{
  "type": "tts_stream_end",
  "data": {
    "totalChunks": 5,
    "duration": 2850  // 毫秒
  }
}
```

### 10. `error` - 錯誤訊息

```json
{
  "type": "error",
  "error": {
    "code": "STT_FAILED",
    "message": "語音識別失敗",
    "details": "未識別到語音"
  }
}
```

### 11. `status` - 狀態更新

```json
{
  "type": "status",
  "data": {
    "stage": "transcribing",  // transcribing, thinking, speaking
    "progress": 0.5
  }
}
```

---

## 🔄 完整對話流程示例

### 場景：用戶說「你好」

```
1. [客戶端] connect
   ↓
2. [服務端] connected
   ↓
3. [客戶端] audio_chunk (chunk 1)
   ↓
4. [服務端] transcription_partial ("你")
   ↓
5. [客戶端] audio_chunk (chunk 2)
   ↓
6. [服務端] transcription_partial ("你好")
   ↓
7. [客戶端] audio_end
   ↓
8. [服務端] transcription_final ("你好")
   ↓
9. [服務端] llm_stream_start
   ↓
10. [服務端] llm_stream_chunk ("你好")
    ↓
11. [服務端] llm_stream_chunk (", 我是")
    ↓
12. [服務端] llm_stream_chunk ("黃蓉")
    ↓
13. [服務端] llm_stream_end ("你好，我是黃蓉")
    ↓
14. [服務端] tts_stream_start
    ↓
15. [服務端] tts_stream_chunk (audio chunk 1)
    ↓
16. [服務端] tts_stream_chunk (audio chunk 2)
    ↓
17. [服務端] tts_stream_end
```

---

## 🛠️ 技術實現

### 1. WebSocket 服務端模組

**檔案：** `modules/websocket-voice.js`

```javascript
import { processVoiceStream } from './voice-stream-ws.js';
import { VoiceSession } from './voice-session.js';

export class VoiceWebSocketServer {
  constructor(expressApp) {
    this.app = expressApp;
    this.sessions = new Map(); // sessionId -> VoiceSession
  }

  setup() {
    // 使用 express-ws 設置 WebSocket 端點
    this.app.ws('/api/voice-ws', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  async handleConnection(ws, req) {
    const session = new VoiceSession(ws);
    this.sessions.set(session.id, session);

    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message);
        await this.handleMessage(session, msg);
      } catch (error) {
        this.sendError(ws, error);
      }
    });

    ws.on('close', () => {
      this.sessions.delete(session.id);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(session.id);
    });
  }

  async handleMessage(session, msg) {
    switch (msg.type) {
      case 'connect':
        await this.handleConnect(session, msg.data);
        break;
      case 'audio_chunk':
        await this.handleAudioChunk(session, msg);
        break;
      case 'audio_end':
        await this.handleAudioEnd(session, msg);
        break;
      case 'interrupt':
        await this.handleInterrupt(session, msg);
        break;
      case 'reset':
        await this.handleReset(session, msg);
        break;
      case 'ping':
        this.handlePing(session, msg);
        break;
      default:
        this.sendError(session.ws, new Error(`Unknown message type: ${msg.type}`));
    }
  }
}
```

### 2. 語音會話管理

**檔案：** `modules/voice-session.js`

```javascript
export class VoiceSession {
  constructor(ws) {
    this.id = this.generateSessionId();
    this.ws = ws;
    this.history = [];
    this.audioBuffer = [];
    this.currentState = 'idle'; // idle, listening, transcribing, thinking, speaking
    this.isInterrupted = false;
    this.userIdentity = null;
    this.userName = null;
    this.language = 'zh';
  }

  async addAudioChunk(chunk) {
    this.audioBuffer.push(chunk);
    // 觸發增量 STT
  }

  async finalizeAudio() {
    // 合併所有音頻片段，進行最終 STT
    // 觸發 LLM 處理
  }

  interrupt() {
    this.isInterrupted = true;
    // 停止當前處理
  }
}
```

### 3. 流式語音處理

**檔案：** `modules/voice-stream-ws.js`

```javascript
import { transcribeFromBase64 } from './stt.js';
import { chatWithLLM } from './llm.js';
import { synthesizeSpeechCartesiaStream } from './tts-cartesia.js';

export async function processVoiceStreamWS(session, audioChunks) {
  // 1. 增量 STT（可選，如果支持）
  // 2. 最終 STT
  // 3. 流式 LLM
  // 4. 流式 TTS
}
```

---

## 📋 實現步驟

### Phase 1: 基礎架構（1-2 天）

- [ ] 設置 WebSocket 端點（express-ws）
- [ ] 實現基礎消息協議
- [ ] 實現會話管理（VoiceSession）
- [ ] 實現連接/斷開處理
- [ ] 實現心跳檢測（ping/pong）

### Phase 2: 音頻處理（2-3 天）

- [ ] 實現音頻片段接收和緩衝
- [ ] 實現 VAD（Voice Activity Detection）或手動結束觸發
- [ ] 集成現有 STT（暫時使用完整音頻）
- [ ] 實現增量 STT（可選，需要 OpenAI Whisper Streaming API）

### Phase 3: LLM 流式處理（2-3 天）

- [ ] 修改 `modules/llm.js` 支持流式輸出
- [ ] 實現 `llm_stream_chunk` 消息
- [ ] 集成 Prompt Routing 到流式流程
- [ ] 實現情緒標籤流式選擇

### Phase 4: TTS 流式處理（2-3 天）

- [ ] 檢查 Cartesia TTS 是否支持流式輸出
- [ ] 實現 TTS 分塊生成（如果支持）
- [ ] 實現 `tts_stream_chunk` 消息
- [ ] 實現邊生成邊播放邏輯

### Phase 5: 打斷機制（1-2 天）

- [ ] 實現 `interrupt` 消息處理
- [ ] 停止當前 LLM 流式生成
- [ ] 停止當前 TTS 生成
- [ ] 清理狀態，準備新輸入

### Phase 6: 前端集成（2-3 天）

- [ ] 實現 WebSocket 客戶端連接
- [ ] 實現音頻錄製和分塊發送
- [ ] 實現流式文字顯示
- [ ] 實現流式音頻播放
- [ ] 實現狀態指示器
- [ ] 實現打斷按鈕

### Phase 7: 測試與優化（2-3 天）

- [ ] 單元測試
- [ ] 集成測試
- [ ] 性能測試
- [ ] 錯誤處理測試
- [ ] 優化延遲和帶寬

---

## 🔍 技術考量

### 1. 音頻格式

- **輸入：** WebM (Opus), PCM, WAV
- **輸出：** WAV (PCM), 考慮 Opus 壓縮
- **採樣率：** 44100 Hz（標準）

### 2. 延遲優化

- **STT：** 使用增量識別（如果支持）
- **LLM：** 流式輸出（SSE）
- **TTS：** 分塊生成和播放
- **網絡：** 使用 WebSocket 二進制消息（如果支持）

### 3. 錯誤處理

- **連接斷開：** 自動重連機制
- **STT 失敗：** 提示用戶重新說話
- **LLM 失敗：** 降級到簡單回應
- **TTS 失敗：** 回退到文字顯示

### 4. 資源管理

- **會話超時：** 30 分鐘無活動自動關閉
- **音頻緩衝：** 限制最大緩衝大小
- **並發連接：** 限制最大連接數

---

## 📊 性能目標

- **端到端延遲：** < 2 秒（從用戶停止說話到開始播放）
- **STT 延遲：** < 1 秒
- **LLM 首字延遲：** < 1 秒
- **TTS 首塊延遲：** < 0.5 秒
- **帶寬：** < 64 kbps（音頻）

---

## 🚧 已知挑戰

1. **Cartesia TTS 流式支持**
   - 需要確認是否支持流式輸出
   - 如果不支持，需要分塊請求或使用其他 TTS

2. **OpenAI Whisper 流式 API**
   - 當前使用的是完整音頻 API
   - 可能需要升級到 Streaming API（如果可用）

3. **前端音頻處理**
   - 需要處理多種音頻格式
   - 需要實現音頻分塊和編碼

4. **狀態同步**
   - 需要確保客戶端和服務端狀態一致
   - 需要處理並發消息

---

## 📚 參考資源

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [express-ws Documentation](https://www.npmjs.com/package/express-ws)
- [Cartesia TTS Documentation](https://docs.cartesia.ai/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**下一步：** 開始 Phase 1 實現，建立基礎 WebSocket 架構。

