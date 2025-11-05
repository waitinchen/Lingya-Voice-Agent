# 🚀 WebSocket 串流實現計劃

**版本：** v1.0  
**目標：** 從 request/response 式升級為 voice pipeline 流模式  
**預計時間：** 14-18 天

---

## 📋 實現階段總覽

| 階段 | 名稱 | 時間 | 狀態 |
|------|------|------|------|
| Phase 1 | 基礎架構 | 1-2 天 | 📋 待開始 |
| Phase 2 | 音頻處理 | 2-3 天 | 📋 待開始 |
| Phase 3 | LLM 流式處理 | 2-3 天 | 📋 待開始 |
| Phase 4 | TTS 流式處理 | 2-3 天 | 📋 待開始 |
| Phase 5 | 打斷機制 | 1-2 天 | 📋 待開始 |
| Phase 6 | 前端集成 | 2-3 天 | 📋 待開始 |
| Phase 7 | 測試與優化 | 2-3 天 | 📋 待開始 |

---

## Phase 1: 基礎架構（1-2 天）

### 目標
建立 WebSocket 連接基礎設施，實現基本的消息協議和會話管理。

### 任務列表

#### 1.1 安裝和配置 WebSocket 支持
- [ ] 確認 `express-ws` 已安裝（已在 package.json 中）
- [ ] 在 `server.js` 中導入 `express-ws`
- [ ] 設置 WebSocket 路由 `/api/voice-ws`

#### 1.2 創建 WebSocket 服務模組
- [ ] 創建 `modules/websocket-voice.js`
- [ ] 實現 `VoiceWebSocketServer` 類
- [ ] 實現連接處理（`handleConnection`）
- [ ] 實現消息路由（`handleMessage`）

#### 1.3 創建會話管理模組
- [ ] 創建 `modules/voice-session.js`
- [ ] 實現 `VoiceSession` 類
- [ ] 實現會話狀態管理（idle, listening, transcribing, thinking, speaking）
- [ ] 實現會話 ID 生成和管理

#### 1.4 實現基礎消息協議
- [ ] 實現 `connect` 消息處理
- [ ] 實現 `connected` 回應
- [ ] 實現 `ping`/`pong` 心跳檢測
- [ ] 實現錯誤消息格式（`error`）

#### 1.5 實現連接管理
- [ ] 實現會話超時（30 分鐘無活動）
- [ ] 實現連接斷開清理
- [ ] 實現錯誤處理和日誌記錄

### 交付物
- `modules/websocket-voice.js` - WebSocket 服務器主模組
- `modules/voice-session.js` - 會話管理模組
- `server.js` 更新 - 集成 WebSocket 端點

### 測試檢查點
- [ ] WebSocket 連接可以建立
- [ ] `connect` 消息可以發送和接收
- [ ] `ping`/`pong` 心跳正常工作
- [ ] 連接斷開時會話正確清理

---

## Phase 2: 音頻處理（2-3 天）

### 目標
實現音頻片段的接收、緩衝和處理，支持增量語音識別。

### 任務列表

#### 2.1 音頻片段接收
- [ ] 實現 `audio_chunk` 消息處理
- [ ] 實現音頻片段緩衝（`VoiceSession.audioBuffer`）
- [ ] 實現音頻格式驗證（webm, pcm, wav）
- [ ] 實現 Base64 解碼

#### 2.2 音頻合併
- [ ] 實現音頻片段合併邏輯
- [ ] 處理不同採樣率和格式
- [ ] 實現音頻緩衝區管理（限制大小）

#### 2.3 語音活動檢測（VAD）
- [ ] 研究 VAD 庫選項（如 `@ricky0123/vad-web`）
- [ ] 實現簡單的 VAD（基於音頻能量）
- [ ] 或實現手動觸發（`audio_end` 消息）

#### 2.4 STT 集成
- [ ] 修改 `modules/stt.js` 支持流式處理（可選）
- [ ] 實現增量 STT（`transcription_partial`）
- [ ] 實現最終 STT（`transcription_final`）
- [ ] 集成現有 `transcribeFromBase64` 函數

#### 2.5 音頻處理優化
- [ ] 實現音頻分塊處理
- [ ] 實現音頻格式轉換（如果需要）
- [ ] 實現音頻壓縮（減少帶寬）

### 交付物
- `modules/voice-stream-ws.js` - 流式語音處理模組
- `modules/audio-processor.js` - 音頻處理工具（可選）
- `VoiceSession` 更新 - 音頻緩衝管理

### 測試檢查點
- [ ] 音頻片段可以正確接收和緩衝
- [ ] 音頻片段可以正確合併
- [ ] STT 可以正確識別音頻
- [ ] `transcription_partial` 和 `transcription_final` 消息正確發送

---

## Phase 3: LLM 流式處理（2-3 天）

### 目標
實現 LLM 的流式輸出，支持增量文字生成和情緒標籤選擇。

### 任務列表

#### 3.1 LLM 流式輸出支持
- [ ] 檢查 `modules/llm.js` 中的 LLM 提供商（Claude/OpenAI）
- [ ] 實現 Claude API 流式輸出（`stream: true`）
- [ ] 實現 OpenAI API 流式輸出（`stream: true`）
- [ ] 創建 `chatWithLLMStream` 函數

#### 3.2 流式消息發送
- [ ] 實現 `llm_stream_start` 消息
- [ ] 實現 `llm_stream_chunk` 消息（增量文字）
- [ ] 實現 `llm_stream_end` 消息（包含完整文字和標籤）
- [ ] 處理流式中斷（interrupt）

#### 3.3 Prompt Routing 集成
- [ ] 修改 `modules/prompt-routing.js` 支持流式
- [ ] 在流式流程中檢查 Prompt Routing
- [ ] 如果匹配，直接返回預定義回應（非流式）
- [ ] 如果不匹配，繼續正常 LLM 流式流程

#### 3.4 情緒標籤流式選擇
- [ ] 在流式輸出中檢測情緒標籤
- [ ] 實現增量標籤選擇（可選）
- [ ] 在 `llm_stream_end` 中包含最終標籤

#### 3.5 錯誤處理
- [ ] 處理 LLM 流式錯誤
- [ ] 實現降級策略（流式失敗時回退到非流式）
- [ ] 實現重試機制

### 交付物
- `modules/llm.js` 更新 - 添加流式支持
- `modules/prompt-routing.js` 更新 - 流式集成
- `modules/voice-stream-ws.js` 更新 - LLM 流式處理

### 測試檢查點
- [ ] LLM 可以正確流式輸出
- [ ] `llm_stream_chunk` 消息正確發送
- [ ] Prompt Routing 在流式流程中正常工作
- [ ] 情緒標籤正確選擇和返回

---

## Phase 4: TTS 流式處理（2-3 天）

### 目標
實現 TTS 的流式輸出，支持邊生成邊播放。

### 任務列表

#### 4.1 Cartesia TTS 流式支持檢查
- [ ] 檢查 Cartesia SDK 是否支持流式輸出
- [ ] 查看 Cartesia API 文檔
- [ ] 如果支持，實現流式 TTS
- [ ] 如果不支持，實現分塊請求

#### 4.2 TTS 分塊生成
- [ ] 實現文字分塊邏輯（按句子或固定長度）
- [ ] 實現分塊 TTS 請求
- [ ] 實現音頻片段合併（可選）
- [ ] 實現 `tts_stream_chunk` 消息

#### 4.3 TTS 流式消息
- [ ] 實現 `tts_stream_start` 消息
- [ ] 實現 `tts_stream_chunk` 消息（音頻片段）
- [ ] 實現 `tts_stream_end` 消息
- [ ] 處理 TTS 流式中斷（interrupt）

#### 4.4 音頻格式處理
- [ ] 確保音頻格式一致（WAV, PCM）
- [ ] 實現音頻採樣率處理
- [ ] 實現音頻編碼（Base64）

#### 4.5 性能優化
- [ ] 實現 TTS 並發處理（如果支持）
- [ ] 實現音頻預取（預生成下一段）
- [ ] 實現緩存機制（相同文字不重複生成）

### 交付物
- `modules/tts-cartesia.js` 更新 - 添加流式支持
- `modules/voice-stream-ws.js` 更新 - TTS 流式處理

### 測試檢查點
- [ ] TTS 可以正確流式生成
- [ ] `tts_stream_chunk` 消息正確發送
- [ ] 音頻格式正確
- [ ] 流式播放延遲低於 0.5 秒

---

## Phase 5: 打斷機制（1-2 天）

### 目標
實現用戶可以打斷當前回應的功能。

### 任務列表

#### 5.1 打斷消息處理
- [ ] 實現 `interrupt` 消息處理
- [ ] 實現打斷狀態標記（`VoiceSession.isInterrupted`）
- [ ] 實現打斷原因記錄

#### 5.2 LLM 流式打斷
- [ ] 停止 LLM 流式生成
- [ ] 清理 LLM 流式狀態
- [ ] 發送 `interrupt` 確認消息

#### 5.3 TTS 流式打斷
- [ ] 停止 TTS 生成請求
- [ ] 清理 TTS 流式狀態
- [ ] 停止當前音頻播放（前端處理）

#### 5.4 狀態清理
- [ ] 清理當前會話狀態
- [ ] 重置 `isInterrupted` 標記
- [ ] 準備接收新輸入

#### 5.5 打斷確認
- [ ] 發送 `interrupted` 消息給客戶端
- [ ] 記錄打斷日誌
- [ ] 處理打斷後的狀態恢復

### 交付物
- `VoiceSession` 更新 - 打斷狀態管理
- `modules/voice-stream-ws.js` 更新 - 打斷處理邏輯

### 測試檢查點
- [ ] `interrupt` 消息可以正確處理
- [ ] LLM 流式可以正確停止
- [ ] TTS 流式可以正確停止
- [ ] 打斷後可以接收新輸入

---

## Phase 6: 前端集成（2-3 天）

### 目標
實現前端 WebSocket 客戶端，支持實時音頻錄製和流式顯示。

### 任務列表

#### 6.1 WebSocket 客戶端
- [ ] 在 `public/index.html` 中實現 WebSocket 連接
- [ ] 實現連接建立和斷開處理
- [ ] 實現心跳檢測（ping/pong）
- [ ] 實現自動重連機制

#### 6.2 音頻錄製
- [ ] 實現音頻錄製（使用 MediaRecorder API）
- [ ] 實現音頻分塊發送（`audio_chunk`）
- [ ] 實現音頻格式處理（WebM）
- [ ] 實現錄音停止和觸發（`audio_end`）

#### 6.3 流式文字顯示
- [ ] 實現 `transcription_partial` 顯示
- [ ] 實現 `transcription_final` 顯示
- [ ] 實現 `llm_stream_chunk` 增量顯示
- [ ] 實現打字機效果（可選）

#### 6.4 流式音頻播放
- [ ] 實現 `tts_stream_chunk` 播放
- [ ] 實現音頻片段隊列管理
- [ ] 實現無縫播放（片段間無間斷）
- [ ] 實現播放進度顯示

#### 6.5 狀態指示器
- [ ] 實現連接狀態指示（連接中、已連接、斷開）
- [ ] 實現處理階段指示（transcribing, thinking, speaking）
- [ ] 實現錯誤狀態顯示
- [ ] 實現打斷按鈕

#### 6.6 UI/UX 優化
- [ ] 實現錄音按鈕動畫
- [ ] 實現思考動畫（三顆球）
- [ ] 實現音頻可視化（波形）
- [ ] 實現響應式設計（移動端適配）

### 交付物
- `public/index.html` 更新 - WebSocket 客戶端集成
- `public/css/websocket.css` - WebSocket 相關樣式（可選）
- `public/js/websocket-client.js` - WebSocket 客戶端模組（可選）

### 測試檢查點
- [ ] WebSocket 連接可以建立
- [ ] 音頻錄製和發送正常工作
- [ ] 流式文字顯示正確
- [ ] 流式音頻播放無間斷
- [ ] 狀態指示器正確顯示

---

## Phase 7: 測試與優化（2-3 天）

### 目標
進行全面測試，優化性能和用戶體驗。

### 任務列表

#### 7.1 單元測試
- [ ] 測試 WebSocket 消息協議
- [ ] 測試會話管理
- [ ] 測試音頻處理
- [ ] 測試 LLM 流式處理
- [ ] 測試 TTS 流式處理

#### 7.2 集成測試
- [ ] 測試完整對話流程
- [ ] 測試打斷機制
- [ ] 測試錯誤處理
- [ ] 測試多用戶並發

#### 7.3 性能測試
- [ ] 測試端到端延遲（目標 < 2 秒）
- [ ] 測試 STT 延遲（目標 < 1 秒）
- [ ] 測試 LLM 首字延遲（目標 < 1 秒）
- [ ] 測試 TTS 首塊延遲（目標 < 0.5 秒）
- [ ] 測試帶寬使用（目標 < 64 kbps）

#### 7.4 錯誤處理測試
- [ ] 測試連接斷開處理
- [ ] 測試 STT 失敗處理
- [ ] 測試 LLM 失敗處理
- [ ] 測試 TTS 失敗處理
- [ ] 測試網絡錯誤處理

#### 7.5 優化
- [ ] 優化音頻處理性能
- [ ] 優化網絡帶寬使用
- [ ] 優化前端渲染性能
- [ ] 優化錯誤提示和用戶體驗

#### 7.6 文檔更新
- [ ] 更新 API 文檔
- [ ] 更新使用說明
- [ ] 更新部署指南
- [ ] 更新故障排除指南

### 交付物
- 測試報告
- 性能報告
- 優化後的代碼
- 更新的文檔

### 測試檢查點
- [ ] 所有單元測試通過
- [ ] 所有集成測試通過
- [ ] 性能指標達到目標
- [ ] 錯誤處理正常
- [ ] 文檔完整

---

## 🔧 技術決策

### 1. WebSocket 庫選擇
- **選擇：** `express-ws`（已安裝）
- **原因：** 與 Express 集成良好，支持現有路由

### 2. 音頻格式
- **輸入：** WebM (Opus) - 瀏覽器原生支持
- **輸出：** WAV (PCM) - 高質量，廣泛支持

### 3. 流式處理策略
- **LLM：** 使用原生流式 API（Claude/OpenAI）
- **TTS：** 分塊請求（如果 Cartesia 不支持流式）

### 4. 狀態管理
- **服務端：** `VoiceSession` 類管理會話狀態
- **客戶端：** 基於消息的狀態同步

---

## 📊 成功標準

### 功能完整性
- ✅ 完整的雙向語音對話
- ✅ 流式文字和音頻顯示
- ✅ 打斷機制正常工作
- ✅ 錯誤處理完善

### 性能指標
- ✅ 端到端延遲 < 2 秒
- ✅ STT 延遲 < 1 秒
- ✅ LLM 首字延遲 < 1 秒
- ✅ TTS 首塊延遲 < 0.5 秒

### 用戶體驗
- ✅ 流暢的對話體驗
- ✅ 清晰的狀態反饋
- ✅ 友好的錯誤提示
- ✅ 響應式設計支持

---

## 🚧 風險與挑戰

### 1. Cartesia TTS 流式支持
- **風險：** 可能不支持流式輸出
- **對策：** 分塊請求或使用其他 TTS

### 2. OpenAI Whisper 流式 API
- **風險：** 當前使用完整音頻 API
- **對策：** 使用增量識別或保持現有方案

### 3. 音頻格式兼容性
- **風險：** 不同瀏覽器支持不同格式
- **對策：** 使用 WebM (Opus) 作為主要格式

### 4. 網絡穩定性
- **風險：** WebSocket 連接可能不穩定
- **對策：** 實現自動重連和錯誤恢復

---

## 📚 參考資源

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [express-ws Documentation](https://www.npmjs.com/package/express-ws)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Cartesia TTS Documentation](https://docs.cartesia.ai/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**下一步：** 開始 Phase 1 實現，建立基礎 WebSocket 架構。

