# Phase 7 下一步執行計劃

**更新時間：** 2025-11-05  
**當前進度：** 60% → 70%

---

## ✅ 剛剛完成

### 1. 健康檢查端點
- **位置：** `server.js` (行 89-111)
- **端點：** `GET /health`
- **功能：**
  - 返回服務器狀態（status, uptime, websocket）
  - 包含 WebSocket 統計信息（如果可用）
  - 環境和版本信息

**測試：**
```bash
curl http://localhost:3000/health
```

**回應示例：**
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T...",
  "uptime": 1234.56,
  "websocket": "enabled",
  "environment": "production",
  "version": "0.1.0",
  "websocket_stats": {
    "total": 1,
    "active": 1,
    "sessions": [...]
  }
}
```

### 2. 測試腳本框架
- **創建：**
  - `test/test-voice-session.js` - VoiceSession 單元測試
  - `test/test-tts-cartesia-stream.js` - TTS 流式處理測試
  - `test/test-health-endpoint.js` - 健康檢查端點測試

---

## 🎯 下一步任務（優先級排序）

### 優先級 1: 完善單元測試（預計 2-3 小時）

#### 1.1 修復現有測試腳本
- [ ] 修復 `test-voice-session.js`（移除 jest 依賴，使用原生 Node.js）
- [ ] 修復 `test-tts-cartesia-stream.js`（添加 mock）
- [ ] 修復 `test-health-endpoint.js`（使用原生 http 測試）

#### 1.2 添加更多單元測試
- [ ] `modules/audio-processor.js` 測試
- [ ] `modules/llm-stream.js` 測試
- [ ] `modules/websocket-voice.js` 核心功能測試

**建議：** 使用原生 Node.js 測試，避免添加額外依賴。

---

### 優先級 2: 性能監控基礎設施（預計 1-2 小時）

#### 2.1 添加性能指標收集
```javascript
// 在 server.js 中添加
const performanceMetrics = {
  requests: { total: 0, errors: 0 },
  websocket: { connections: 0, messages: 0 },
  tts: { calls: 0, avgDuration: 0 },
  llm: { calls: 0, avgDuration: 0 },
};
```

#### 2.2 擴展健康檢查端點
- [ ] 添加性能指標到 `/health` 回應
- [ ] 添加內存使用監控
- [ ] 添加響應時間統計

#### 2.3 會話統計 API
- [ ] 創建 `GET /api/stats` 端點
- [ ] 返回詳細的會話和性能統計

---

### 優先級 3: 性能優化（預計 2-3 小時）

#### 3.1 音頻緩衝區管理
- [ ] 限制緩衝區大小（防止內存溢出）
- [ ] 實現自動清理機制
- [ ] 優化音頻片段合併邏輯

#### 3.2 並發處理優化
- [ ] 限制同時處理的會話數
- [ ] 實現請求隊列
- [ ] 添加超時機制

#### 3.3 內存優化
- [ ] 監控內存使用
- [ ] 實現會話清理機制
- [ ] 優化音頻數據處理

---

### 優先級 4: 完整集成測試（預計 3-4 小時）

#### 4.1 E2E 測試
- [ ] 完整的語音對話流程測試
- [ ] WebSocket 連接和斷開測試
- [ ] 錯誤恢復測試

#### 4.2 性能測試
- [ ] 並發連接測試
- [ ] 響應時間測試
- [ ] 內存洩漏測試

#### 4.3 壓力測試
- [ ] 高負載測試
- [ ] 長時間運行測試
- [ ] 錯誤處理測試

---

## 📋 執行建議

### 立即執行（今天）
1. ✅ 健康檢查端點（已完成）
2. 修復現有測試腳本（1 小時）
3. 添加性能指標收集（1 小時）

### 本週完成
1. 完善單元測試（2-3 小時）
2. 性能監控基礎設施（1-2 小時）
3. 基礎性能優化（2-3 小時）

### 下週完成
1. 完整集成測試（3-4 小時）
2. 壓力測試（2-3 小時）
3. 文檔更新（1 小時）

---

## 🎯 目標

**Phase 7 完成度：** 60% → **100%**

**關鍵指標：**
- [ ] 單元測試覆蓋率 > 70%
- [ ] 健康檢查端點可用 ✅
- [ ] 性能監控基礎設施完成
- [ ] 性能優化完成
- [ ] 集成測試通過

---

**最後更新：** 2025-11-05

