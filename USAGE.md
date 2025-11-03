# 使用說明

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

創建 `.env` 文件並填入配置：

```env
# LLM 配置（選擇其一）
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# 或使用 OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=your-api-key

# Whisper 配置
WHISPER_MODEL=base
WHISPER_DEVICE=cpu

# XTTS 配置
XTTS_MODEL=tts_models/multilingual/multi-dataset/xtts_v2
XTTS_LANG=zh
```

### 3. 啟動服務

```bash
npm start
```

## API 使用

### REST API

#### 健康檢查

```bash
GET http://localhost:3000/health
```

#### 文字對話（測試用）

```bash
POST http://localhost:3000/api/text
Content-Type: application/json

{
  "text": "你好",
  "context": {
    "tone": "自然",
    "history": []
  }
}
```

#### 語音對話

```bash
POST http://localhost:3000/api/chat
Content-Type: application/json

{
  "audio": "<base64-encoded-audio>",
  "context": {
    "language": "zh",
    "tone": "自然"
  }
}
```

### WebSocket API

連接至 `ws://localhost:3000/api/voice` 進行即時語音對話。

#### 發送音頻

```javascript
{
  "type": "audio",
  "data": "<base64-encoded-audio>",
  "context": {
    "language": "zh",
    "tone": "自然"
  }
}
```

#### 接收回應

```javascript
{
  "type": "response",
  "text": "AI 回應的文字",
  "audio": "<base64-encoded-audio>",
  "emotion": "開心"
}
```

#### 重置對話

```javascript
{
  "type": "reset"
}
```

## 前端整合範例

### JavaScript (WebSocket)

```javascript
const ws = new WebSocket('ws://localhost:3000/api/voice');

ws.onopen = () => {
  console.log('已連接');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'response') {
    console.log('AI 回應:', data.text);
    // 播放音頻
    playAudio(data.audio);
  }
};

// 發送音頻
function sendAudio(audioBase64) {
  ws.send(JSON.stringify({
    type: 'audio',
    data: audioBase64,
    context: {
      language: 'zh',
    },
  }));
}
```

### Python (測試用)

```python
import requests
import base64

# 讀取音頻文件
with open('audio.wav', 'rb') as f:
    audio_data = base64.b64encode(f.read()).decode('utf-8')

# 發送請求
response = requests.post('http://localhost:3000/api/chat', json={
    'audio': audio_data,
    'context': {
        'language': 'zh',
        'tone': '自然',
    },
})

result = response.json()
print('AI 回應:', result['text'])
```

## 注意事項

1. **Whisper 模型**: 首次運行會自動下載模型，需要網路連接。
2. **XTTS**: 目前 TTS 模組為框架實作，需要根據實際的 XTTS 部署方式調整。
3. **Ollama**: 如果使用 Ollama，請確保 Ollama 服務正在運行。
4. **音頻格式**: 建議使用 WAV 格式，16kHz 或更高採樣率。

