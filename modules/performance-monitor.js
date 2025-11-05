/**
 * 性能監控模組
 * 收集和追蹤系統性能指標
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        byEndpoint: new Map(),
        responseTimes: [],
      },
      websocket: {
        connections: 0,
        totalConnections: 0,
        messages: 0,
        errors: 0,
        avgMessageSize: 0,
      },
      tts: {
        calls: 0,
        errors: 0,
        durations: [],
        avgDuration: 0,
        totalDuration: 0,
      },
      llm: {
        calls: 0,
        errors: 0,
        durations: [],
        avgDuration: 0,
        totalDuration: 0,
      },
      stt: {
        calls: 0,
        errors: 0,
        durations: [],
        avgDuration: 0,
        totalDuration: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
    };

    // 定期更新內存使用情況
    this.updateMemoryInterval = setInterval(() => {
      this.updateMemoryUsage();
    }, 5000); // 每 5 秒更新一次
  }

  /**
   * 記錄 HTTP 請求
   */
  recordRequest(endpoint, statusCode, duration) {
    this.metrics.requests.total++;
    
    if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }

    // 按端點統計
    if (!this.metrics.requests.byEndpoint.has(endpoint)) {
      this.metrics.requests.byEndpoint.set(endpoint, {
        count: 0,
        errors: 0,
        totalDuration: 0,
        avgDuration: 0,
      });
    }

    const endpointStats = this.metrics.requests.byEndpoint.get(endpoint);
    endpointStats.count++;
    endpointStats.totalDuration += duration;
    endpointStats.avgDuration = endpointStats.totalDuration / endpointStats.count;
    
    if (statusCode >= 400) {
      endpointStats.errors++;
    }

    // 記錄響應時間（保留最近 1000 個）
    this.metrics.requests.responseTimes.push(duration);
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }
  }

  /**
   * 記錄 WebSocket 連接
   */
  recordWebSocketConnection() {
    this.metrics.websocket.connections++;
    this.metrics.websocket.totalConnections++;
  }

  /**
   * 記錄 WebSocket 斷開
   */
  recordWebSocketDisconnect() {
    if (this.metrics.websocket.connections > 0) {
      this.metrics.websocket.connections--;
    }
  }

  /**
   * 記錄 WebSocket 消息
   */
  recordWebSocketMessage(size) {
    this.metrics.websocket.messages++;
    
    // 計算平均消息大小（移動平均）
    const currentAvg = this.metrics.websocket.avgMessageSize;
    const count = this.metrics.websocket.messages;
    this.metrics.websocket.avgMessageSize = 
      (currentAvg * (count - 1) + size) / count;
  }

  /**
   * 記錄 WebSocket 錯誤
   */
  recordWebSocketError() {
    this.metrics.websocket.errors++;
  }

  /**
   * 記錄 TTS 調用
   */
  recordTTS(duration, success = true) {
    this.metrics.tts.calls++;
    
    if (!success) {
      this.metrics.tts.errors++;
      return;
    }

    this.metrics.tts.durations.push(duration);
    this.metrics.tts.totalDuration += duration;
    
    // 保留最近 100 個記錄
    if (this.metrics.tts.durations.length > 100) {
      const removed = this.metrics.tts.durations.shift();
      this.metrics.tts.totalDuration -= removed;
    }

    // 計算平均時長
    this.metrics.tts.avgDuration = 
      this.metrics.tts.totalDuration / this.metrics.tts.durations.length;
  }

  /**
   * 記錄 LLM 調用
   */
  recordLLM(duration, success = true) {
    this.metrics.llm.calls++;
    
    if (!success) {
      this.metrics.llm.errors++;
      return;
    }

    this.metrics.llm.durations.push(duration);
    this.metrics.llm.totalDuration += duration;
    
    // 保留最近 100 個記錄
    if (this.metrics.llm.durations.length > 100) {
      const removed = this.metrics.llm.durations.shift();
      this.metrics.llm.totalDuration -= removed;
    }

    // 計算平均時長
    this.metrics.llm.avgDuration = 
      this.metrics.llm.totalDuration / this.metrics.llm.durations.length;
  }

  /**
   * 記錄 STT 調用
   */
  recordSTT(duration, success = true) {
    this.metrics.stt.calls++;
    
    if (!success) {
      this.metrics.stt.errors++;
      return;
    }

    this.metrics.stt.durations.push(duration);
    this.metrics.stt.totalDuration += duration;
    
    // 保留最近 100 個記錄
    if (this.metrics.stt.durations.length > 100) {
      const removed = this.metrics.stt.durations.shift();
      this.metrics.stt.totalDuration -= removed;
    }

    // 計算平均時長
    this.metrics.stt.avgDuration = 
      this.metrics.stt.totalDuration / this.metrics.stt.durations.length;
  }

  /**
   * 更新內存使用情況
   */
  updateMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    };
  }

  /**
   * 獲取性能指標
   */
  getMetrics() {
    // 計算平均響應時間
    const avgResponseTime = this.metrics.requests.responseTimes.length > 0
      ? this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.requests.responseTimes.length
      : 0;

    // 計算錯誤率
    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
      : 0;

    // 轉換端點統計為對象
    const endpointStats = {};
    for (const [endpoint, stats] of this.metrics.requests.byEndpoint.entries()) {
      endpointStats[endpoint] = {
        count: stats.count,
        errors: stats.errors,
        avgDuration: Math.round(stats.avgDuration),
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
      };
    }

    return {
      requests: {
        total: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        byEndpoint: endpointStats,
      },
      websocket: {
        activeConnections: this.metrics.websocket.connections,
        totalConnections: this.metrics.websocket.totalConnections,
        messages: this.metrics.websocket.messages,
        errors: this.metrics.websocket.errors,
        avgMessageSize: Math.round(this.metrics.websocket.avgMessageSize),
      },
      tts: {
        calls: this.metrics.tts.calls,
        errors: this.metrics.tts.errors,
        errorRate: this.metrics.tts.calls > 0 
          ? Math.round((this.metrics.tts.errors / this.metrics.tts.calls) * 100 * 100) / 100
          : 0,
        avgDuration: Math.round(this.metrics.tts.avgDuration),
      },
      llm: {
        calls: this.metrics.llm.calls,
        errors: this.metrics.llm.errors,
        errorRate: this.metrics.llm.calls > 0
          ? Math.round((this.metrics.llm.errors / this.metrics.llm.calls) * 100 * 100) / 100
          : 0,
        avgDuration: Math.round(this.metrics.llm.avgDuration),
      },
      stt: {
        calls: this.metrics.stt.calls,
        errors: this.metrics.stt.errors,
        errorRate: this.metrics.stt.calls > 0
          ? Math.round((this.metrics.stt.errors / this.metrics.stt.calls) * 100 * 100) / 100
          : 0,
        avgDuration: Math.round(this.metrics.stt.avgDuration),
      },
      memory: {
        heapUsed: this.metrics.memory.heapUsed,
        heapTotal: this.metrics.memory.heapTotal,
        external: this.metrics.memory.external,
        rss: this.metrics.memory.rss,
        heapUsedMB: Math.round(this.metrics.memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(this.metrics.memory.heapTotal / 1024 / 1024),
        rssMB: Math.round(this.metrics.memory.rss / 1024 / 1024),
        heapUsagePercent: this.metrics.memory.heapTotal > 0
          ? Math.round((this.metrics.memory.heapUsed / this.metrics.memory.heapTotal) * 100 * 100) / 100
          : 0,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 重置所有指標
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        byEndpoint: new Map(),
        responseTimes: [],
      },
      websocket: {
        connections: 0,
        totalConnections: 0,
        messages: 0,
        errors: 0,
        avgMessageSize: 0,
      },
      tts: {
        calls: 0,
        errors: 0,
        durations: [],
        avgDuration: 0,
        totalDuration: 0,
      },
      llm: {
        calls: 0,
        errors: 0,
        durations: [],
        avgDuration: 0,
        totalDuration: 0,
      },
      stt: {
        calls: 0,
        errors: 0,
        durations: [],
        avgDuration: 0,
        totalDuration: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
    };
  }

  /**
   * 清理資源
   */
  destroy() {
    if (this.updateMemoryInterval) {
      clearInterval(this.updateMemoryInterval);
      this.updateMemoryInterval = null;
    }
  }
}

// 創建全局性能監控實例
let performanceMonitor = null;

export function getPerformanceMonitor() {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export { PerformanceMonitor };

