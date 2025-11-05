/**
 * 緩衝區管理模組
 * 優化音頻和數據緩衝區管理，防止內存洩漏
 */

class BufferManager {
  constructor(options = {}) {
    this.maxBufferSize = options.maxBufferSize || 10 * 1024 * 1024; // 10MB
    this.maxChunks = options.maxChunks || 1000;
    this.cleanupInterval = options.cleanupInterval || 30000; // 30秒
    this.buffers = new Map(); // sessionId -> { chunks, totalSize, lastAccess }
    
    // 定期清理
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * 添加緩衝區塊
   */
  addChunk(sessionId, chunk, metadata = {}) {
    if (!this.buffers.has(sessionId)) {
      this.buffers.set(sessionId, {
        chunks: [],
        totalSize: 0,
        lastAccess: Date.now(),
        metadata,
      });
    }

    const buffer = this.buffers.get(sessionId);
    const chunkSize = Buffer.isBuffer(chunk) ? chunk.length : 
                     (typeof chunk === 'string' ? Buffer.byteLength(chunk) : 
                     (chunk.length || 0));

    // 檢查大小限制
    if (buffer.totalSize + chunkSize > this.maxBufferSize) {
      console.warn(`⚠️  緩衝區大小超限 (${sessionId}): ${buffer.totalSize + chunkSize} > ${this.maxBufferSize}`);
      this.clearBuffer(sessionId);
      return false;
    }

    // 檢查塊數限制
    if (buffer.chunks.length >= this.maxChunks) {
      console.warn(`⚠️  緩衝區塊數超限 (${sessionId}): ${buffer.chunks.length} >= ${this.maxChunks}`);
      this.clearBuffer(sessionId);
      return false;
    }

    buffer.chunks.push(chunk);
    buffer.totalSize += chunkSize;
    buffer.lastAccess = Date.now();

    return true;
  }

  /**
   * 獲取緩衝區
   */
  getBuffer(sessionId) {
    const buffer = this.buffers.get(sessionId);
    if (buffer) {
      buffer.lastAccess = Date.now();
      return buffer.chunks;
    }
    return null;
  }

  /**
   * 清空緩衝區
   */
  clearBuffer(sessionId) {
    const buffer = this.buffers.get(sessionId);
    if (buffer) {
      buffer.chunks = [];
      buffer.totalSize = 0;
      buffer.lastAccess = Date.now();
    }
  }

  /**
   * 刪除緩衝區
   */
  deleteBuffer(sessionId) {
    this.buffers.delete(sessionId);
  }

  /**
   * 獲取緩衝區統計
   */
  getStats(sessionId) {
    const buffer = this.buffers.get(sessionId);
    if (!buffer) {
      return null;
    }

    return {
      chunkCount: buffer.chunks.length,
      totalSize: buffer.totalSize,
      lastAccess: buffer.lastAccess,
      age: Date.now() - buffer.lastAccess,
    };
  }

  /**
   * 清理過期緩衝區
   */
  cleanup(maxAge = 300000) { // 5分鐘
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, buffer] of this.buffers.entries()) {
      if (now - buffer.lastAccess > maxAge) {
        this.buffers.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 清理了 ${cleaned} 個過期緩衝區`);
    }
  }

  /**
   * 獲取所有緩衝區統計
   */
  getAllStats() {
    const stats = {
      totalBuffers: this.buffers.size,
      totalSize: 0,
      totalChunks: 0,
    };

    for (const buffer of this.buffers.values()) {
      stats.totalSize += buffer.totalSize;
      stats.totalChunks += buffer.chunks.length;
    }

    return stats;
  }

  /**
   * 銷毀管理器
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.buffers.clear();
  }
}

// 創建全局緩衝區管理器實例
let bufferManager = null;

export function getBufferManager(options = {}) {
  if (!bufferManager) {
    bufferManager = new BufferManager(options);
  }
  return bufferManager;
}

export { BufferManager };

