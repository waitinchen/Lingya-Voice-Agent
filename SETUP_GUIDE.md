# 設定指南

## 前置需求

### 1. Node.js

確保已安裝 Node.js 18+：

```bash
node --version
```

### 2. Python（用於某些模型）

部分模型可能需要 Python 環境，建議安裝 Python 3.9+。

### 3. Ollama（如果使用本地 LLM）

下載並安裝 [Ollama](https://ollama.ai/)，然後啟動模型：

```bash
ollama serve
ollama pull llama2
# 或
ollama pull mistral
```

### 4. Coqui TTS（語音合成）

#### 選項 A: 使用 Python SDK

```bash
pip install TTS
```

然後運行 TTS 服務：

```python
# tts_server.py
from TTS.api import TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
# 啟動 API 服務（需要自行實作或使用第三方工具）
```

#### 選項 B: 使用 Coqui Cloud API

如果使用雲端 API，需要在配置中設定 API Key。

## 安裝步驟

### 1. 克隆或創建專案

```bash
cd Lingya_Voice_Agent
```

### 2. 安裝 Node.js 依賴

```bash
npm install
```

### 3. 設定環境變數

複製 `.env.example` 並填入實際值：

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

編輯 `.env` 文件：

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### 4. 測試 Ollama（如果使用）

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama2",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

### 5. 啟動服務

```bash
npm start
```

或開發模式（自動重啟）：

```bash
npm run dev
```

## 驗證安裝

1. 檢查健康狀態：

```bash
curl http://localhost:3000/health
```

應該返回：

```json
{
  "status": "ok",
  "initialized": true,
  "timestamp": "..."
}
```

2. 測試文字對話：

```bash
curl -X POST http://localhost:3000/api/text \
  -H "Content-Type: application/json" \
  -d '{"text": "你好"}'
```

## 常見問題

### Whisper 模型下載失敗

- 檢查網路連接
- 手動設定模型路徑（如果已下載）
- 使用較小的模型（如 `tiny` 或 `base`）

### Ollama 連接失敗

- 確認 Ollama 服務正在運行：`curl http://localhost:11434/api/tags`
- 檢查 `OLLAMA_BASE_URL` 是否正確
- 確認模型已下載：`ollama list`

### TTS 無法使用

- XTTS 模組目前為框架實作，需要根據實際部署方式調整
- 可以暫時跳過 TTS，僅測試文字對話功能
- 或整合其他 TTS 服務（如 Google TTS、Azure TTS）

### 記憶體不足

- 使用較小的 Whisper 模型（`tiny` 或 `base`）
- 使用 CPU 模式（`WHISPER_DEVICE=cpu`）
- 考慮使用雲端 API 替代本地模型

## 下一步

- 實作完整的 XTTS 整合
- 接入 Supabase 儲存對話歷史和情緒記憶
- 整合 n8n 進行自動化調整
- 優化語音流處理性能



