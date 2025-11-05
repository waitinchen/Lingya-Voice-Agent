/**
 * 語音會話管理模組
 * 管理每個 WebSocket 連接的會話狀態
 */

import { randomUUID } from "crypto";

/**
 * 會話狀態
 */
export const SessionState = {
  IDLE: "idle",              // 空閒，等待輸入
  LISTENING: "listening",     // 正在接收音頻
  TRANSCRIBING: "transcribing", // 正在轉錄語音
  THINKING: "thinking",      // 正在思考（LLM 生成中）
  SPEAKING: "speaking",       // 正在說話（TTS 生成中）
};

/**
 * 語音會話類
 */
export class VoiceSession {
  constructor(ws, options = {}) {
    this.id = this.generateSessionId();
    this.ws = ws;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    
    // 會話狀態
    this.currentState = SessionState.IDLE;
    this.isInterrupted = false;
    
    // 用戶信息
    this.userIdentity = options.userIdentity || null;
    this.userName = options.userName || null;
    this.language = options.language || "zh";
    
    // 對話上下文
    this.history = [];
    this.audioBuffer = []; // 音頻片段緩衝區
    
    // 當前處理狀態
    this.currentTranscription = "";
    this.currentLLMResponse = "";
    this.currentTags = [];
    
    // 打斷控制（AbortController）
    this.abortController = null;
    
    // 會話超時設置（30 分鐘）
    this.timeout = 30 * 60 * 1000; // 30 分鐘
    this.timeoutTimer = null;
    
    // 啟動超時計時器
    this.resetTimeout();
  }

  /**
   * 生成會話 ID
   */
  generateSessionId() {
    return `session-${randomUUID()}`;
  }

  /**
   * 更新活動時間
   */
  updateActivity() {
    this.lastActivity = Date.now();
    this.resetTimeout();
  }

  /**
   * 重置超時計時器
   */
  resetTimeout() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    
    this.timeoutTimer = setTimeout(() => {
      console.log(`⏰ 會話 ${this.id} 超時，準備關閉`);
      this.close("timeout");
    }, this.timeout);
  }

  /**
   * 設置會話狀態
   */
  setState(newState) {
    const oldState = this.currentState;
    this.currentState = newState;
    this.updateActivity();
    
    console.log(`🔄 會話 ${this.id} 狀態變更: ${oldState} → ${newState}`);
    
    return { oldState, newState };
  }

  /**
   * 添加音頻片段
   */
  addAudioChunk(chunk) {
    this.audioBuffer.push(chunk);
    this.updateActivity();
  }

  /**
   * 獲取所有音頻片段
   */
  getAudioBuffer() {
    return this.audioBuffer;
  }

  /**
   * 清空音頻緩衝區
   */
  clearAudioBuffer() {
    this.audioBuffer = [];
  }

  /**
   * 更新對話歷史
   */
  addToHistory(role, content) {
    this.history.push({ role, content });
    // 限制歷史長度（最多保留最近 50 輪對話）
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    this.updateActivity();
  }

  /**
   * 設置用戶信息
   */
  setUserInfo(userIdentity, userName) {
    this.userIdentity = userIdentity;
    this.userName = userName;
    this.updateActivity();
  }

  /**
   * 設置語言
   */
  setLanguage(language) {
    this.language = language;
    this.updateActivity();
  }

  /**
   * 創建新的 AbortController（用於中止當前操作）
   */
  createAbortController() {
    // 如果已經存在，先中止舊的
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.abortController = new AbortController();
    return this.abortController;
  }

  /**
   * 獲取當前的 AbortSignal
   */
  getAbortSignal() {
    if (!this.abortController) {
      this.createAbortController();
    }
    return this.abortController.signal;
  }

  /**
   * 打斷當前處理
   */
  interrupt(reason = "user_interrupt") {
    this.isInterrupted = true;
    
    // 中止當前的 AbortController
    if (this.abortController && !this.abortController.signal.aborted) {
      console.log(`⏹️  中止當前的 API 請求 (${this.id})`);
      this.abortController.abort(reason);
    }
    
    this.updateActivity();
    console.log(`⏹️  會話 ${this.id} 被打斷: ${reason}`);
  }

  /**
   * 重置打斷狀態
   */
  resetInterrupt() {
    this.isInterrupted = false;
    
    // 創建新的 AbortController（為下一次操作準備）
    this.abortController = null;
    
    this.updateActivity();
  }

  /**
   * 重置會話（清除歷史和狀態）
   */
  reset(clearHistory = true) {
    // 中止當前的操作
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort("reset");
    }
    
    if (clearHistory) {
      this.history = [];
    }
    this.audioBuffer = [];
    this.currentTranscription = "";
    this.currentLLMResponse = "";
    this.currentTags = [];
    this.isInterrupted = false;
    this.abortController = null;
    this.setState(SessionState.IDLE);
    this.updateActivity();
    console.log(`🔄 會話 ${this.id} 已重置`);
  }

  /**
   * 獲取會話狀態信息
   */
  getState() {
    return {
      sessionId: this.id,
      state: this.currentState,
      isInterrupted: this.isInterrupted,
      userIdentity: this.userIdentity,
      userName: this.userName,
      language: this.language,
      historyLength: this.history.length,
      audioBufferLength: this.audioBuffer.length,
      uptime: Date.now() - this.createdAt,
      lastActivity: this.lastActivity,
    };
  }

  /**
   * 關閉會話
   */
  close(reason = "normal") {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    
    console.log(`🔌 會話 ${this.id} 關閉: ${reason}`);
    
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.close();
    }
  }

  /**
   * 檢查會話是否活躍
   */
  isAlive() {
    return this.ws && this.ws.readyState === this.ws.OPEN;
  }
}

