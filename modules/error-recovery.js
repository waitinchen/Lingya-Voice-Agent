/**
 * 错误恢复机制模块
 * 提供自动重试、降级处理、错误恢复等功能
 */

/**
 * 错误恢复管理器
 */
export class ErrorRecoveryManager {
  constructor(options = {}) {
    this.options = {
      // 最大重试次数
      maxRetries: options.maxRetries || 3,
      // 重试延迟（毫秒）
      retryDelay: options.retryDelay || 1000,
      // 指数退避
      exponentialBackoff: options.exponentialBackoff !== false,
      // 错误类型处理
      errorHandlers: options.errorHandlers || {},
      // 降级处理函数
      fallbackHandler: options.fallbackHandler || null,
      ...options,
    };
    
    this.retryCount = 0;
    this.errorHistory = [];
  }

  /**
   * 执行带重试的操作
   * @param {Function} operation - 要执行的操作（返回 Promise）
   * @param {Object} context - 上下文信息
   * @returns {Promise<any>} 操作结果
   */
  async executeWithRetry(operation, context = {}) {
    this.retryCount = 0;
    
    while (this.retryCount <= this.options.maxRetries) {
      try {
        const result = await operation();
        // 成功，重置重试计数
        this.retryCount = 0;
        return result;
      } catch (error) {
        this.retryCount++;
        this.errorHistory.push({
          error,
          timestamp: Date.now(),
          context,
          retryCount: this.retryCount,
        });

        // 检查是否应该重试
        if (this.retryCount > this.options.maxRetries) {
          // 达到最大重试次数，尝试降级处理
          if (this.options.fallbackHandler) {
            console.warn(`⚠️ 达到最大重试次数，尝试降级处理`);
            try {
              return await this.options.fallbackHandler(error, context);
            } catch (fallbackError) {
              console.error(`❌ 降级处理也失败:`, fallbackError);
              throw error; // 抛出原始错误
            }
          }
          throw error;
        }

        // 检查错误类型，决定是否应该重试
        if (!this.shouldRetry(error)) {
          throw error;
        }

        // 计算延迟时间
        const delay = this.calculateDelay();
        console.warn(
          `⚠️ 操作失败 (${this.retryCount}/${this.options.maxRetries})，${delay}ms 后重试:`,
          error.message
        );

        await this.sleep(delay);
      }
    }
  }

  /**
   * 判断是否应该重试
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否应该重试
   */
  shouldRetry(error) {
    // 检查是否有自定义错误处理器
    const errorType = error.name || error.constructor.name;
    if (this.options.errorHandlers[errorType]) {
      const handler = this.options.errorHandlers[errorType];
      return handler.shouldRetry !== false;
    }

    // 默认重试策略
    // 网络错误、超时错误应该重试
    if (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.message?.includes('timeout') ||
      error.message?.includes('network') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT')
    ) {
      return true;
    }

    // 4xx 错误通常不应该重试（除了 429 Too Many Requests）
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }

    // 5xx 错误应该重试
    if (error.status >= 500) {
      return true;
    }

    // 其他错误默认重试
    return true;
  }

  /**
   * 计算重试延迟
   * @returns {number} 延迟时间（毫秒）
   */
  calculateDelay() {
    if (this.options.exponentialBackoff) {
      // 指数退避：delay = baseDelay * 2^(retryCount - 1)
      return this.options.retryDelay * Math.pow(2, this.retryCount - 1);
    }
    return this.options.retryDelay;
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重置管理器
   */
  reset() {
    this.retryCount = 0;
    this.errorHistory = [];
  }

  /**
   * 获取错误历史
   */
  getErrorHistory() {
    return [...this.errorHistory];
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }
}

/**
 * WebSocket 连接恢复管理器
 */
export class WebSocketRecoveryManager {
  constructor(options = {}) {
    this.options = {
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000,
      exponentialBackoff: options.exponentialBackoff !== false,
      onReconnect: options.onReconnect || null,
      ...options,
    };
    
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }

  /**
   * 尝试重连
   * @param {Function} connectFunction - 连接函数
   * @returns {Promise<WebSocket>} WebSocket 连接
   */
  async reconnect(connectFunction) {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      throw new Error(`达到最大重连次数: ${this.options.maxReconnectAttempts}`);
    }

    this.reconnectAttempts++;
    const delay = this.calculateDelay();
    
    console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})，${delay}ms 后...`);
    
    await this.sleep(delay);
    
    try {
      const ws = await connectFunction();
      this.reconnectAttempts = 0; // 重置计数
      
      if (this.options.onReconnect) {
        this.options.onReconnect(ws);
      }
      
      return ws;
    } catch (error) {
      console.error(`❌ 重连失败:`, error);
      throw error;
    }
  }

  calculateDelay() {
    if (this.options.exponentialBackoff) {
      return this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    }
    return this.options.reconnectDelay;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * 创建错误恢复管理器（工厂函数）
 */
export function createErrorRecoveryManager(options = {}) {
  return new ErrorRecoveryManager(options);
}

/**
 * 创建 WebSocket 恢复管理器（工厂函数）
 */
export function createWebSocketRecoveryManager(options = {}) {
  return new WebSocketRecoveryManager(options);
}

