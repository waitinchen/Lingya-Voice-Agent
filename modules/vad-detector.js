/**
 * VAD (Voice Activity Detection) 语音活动检测模块
 * 用于自动检测语音开始和结束，实现自动停止录音
 */

/**
 * VAD 检测器类
 */
export class VADDetector {
  constructor(options = {}) {
    this.options = {
      // 音量阈值（0-255，低于此值视为静音）
      silenceThreshold: options.silenceThreshold || 30,
      // 最大静音时长（毫秒），超过此值视为语音结束
      maxSilenceDuration: options.maxSilenceDuration || 2000,
      // 最小语音时长（毫秒），低于此值视为噪音
      minSpeechDuration: options.minSpeechDuration || 300,
      // 语音检测回调
      onSpeechStart: options.onSpeechStart || null,
      onSpeechEnd: options.onSpeechEnd || null,
      onSilence: options.onSilence || null,
      ...options,
    };
    
    this.silenceStartTime = null;
    this.speechStartTime = null;
    this.isSpeaking = false;
    this.volumeHistory = []; // 用于平滑处理
    this.historySize = 10;
  }

  /**
   * 处理音频数据
   * @param {Float32Array|Int16Array} audioData - 音频数据
   * @param {number} sampleRate - 采样率
   */
  processAudio(audioData, sampleRate = 16000) {
    // 计算音量（RMS）
    const volume = this.calculateVolume(audioData);
    
    // 添加到历史记录
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > this.historySize) {
      this.volumeHistory.shift();
    }
    
    // 平滑处理（使用移动平均）
    const smoothedVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
    
    // 检测语音活动
    if (smoothedVolume >= this.options.silenceThreshold) {
      // 检测到声音
      this.handleSound(smoothedVolume);
    } else {
      // 检测到静音
      this.handleSilence();
    }
  }

  /**
   * 计算音频音量（RMS）
   * @param {Float32Array|Int16Array} audioData - 音频数据
   * @returns {number} 音量值（0-255）
   */
  calculateVolume(audioData) {
    let sum = 0;
    let max = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const value = Math.abs(audioData[i]);
      sum += value * value;
      max = Math.max(max, value);
    }
    
    // RMS (Root Mean Square)
    const rms = Math.sqrt(sum / audioData.length);
    
    // 转换为 0-255 范围
    // 对于 Float32Array: [-1, 1] -> [0, 255]
    // 对于 Int16Array: [-32768, 32767] -> [0, 255]
    let normalized;
    if (audioData instanceof Float32Array) {
      normalized = Math.min(255, rms * 255);
    } else {
      normalized = Math.min(255, (rms / 32768) * 255);
    }
    
    return normalized;
  }

  /**
   * 处理声音检测
   * @param {number} volume - 音量值
   */
  handleSound(volume) {
    // 重置静音计时
    if (this.silenceStartTime !== null) {
      this.silenceStartTime = null;
    }
    
    // 检测语音开始
    if (!this.isSpeaking) {
      this.speechStartTime = Date.now();
      this.isSpeaking = true;
      
      if (this.options.onSpeechStart && typeof this.options.onSpeechStart === 'function') {
        this.options.onSpeechStart({
          volume,
          timestamp: this.speechStartTime,
        });
      }
    }
  }

  /**
   * 处理静音检测
   */
  handleSilence() {
    // 如果正在说话，开始静音计时
    if (this.isSpeaking) {
      if (this.silenceStartTime === null) {
        this.silenceStartTime = Date.now();
      }
      
      const silenceDuration = Date.now() - this.silenceStartTime;
      
      // 检查是否超过最大静音时长
      if (silenceDuration >= this.options.maxSilenceDuration) {
        // 检测语音结束
        const speechDuration = Date.now() - this.speechStartTime;
        
        // 检查是否达到最小语音时长（避免误判短噪音）
        if (speechDuration >= this.options.minSpeechDuration) {
          this.isSpeaking = false;
          this.silenceStartTime = null;
          
          if (this.options.onSpeechEnd && typeof this.options.onSpeechEnd === 'function') {
            this.options.onSpeechEnd({
              speechDuration,
              timestamp: Date.now(),
            });
          }
        } else {
          // 太短，可能是噪音，重置状态
          this.isSpeaking = false;
          this.silenceStartTime = null;
        }
      } else {
        // 静音中，但未超过阈值
        if (this.options.onSilence && typeof this.options.onSilence === 'function') {
          this.options.onSilence({
            duration: silenceDuration,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * 重置检测器
   */
  reset() {
    this.silenceStartTime = null;
    this.speechStartTime = null;
    this.isSpeaking = false;
    this.volumeHistory = [];
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      isSpeaking: this.isSpeaking,
      silenceStartTime: this.silenceStartTime,
      speechStartTime: this.speechStartTime,
      currentVolume: this.volumeHistory.length > 0 
        ? this.volumeHistory[this.volumeHistory.length - 1] 
        : 0,
    };
  }
}

/**
 * 创建 VAD 检测器（工厂函数）
 */
export function createVADDetector(options = {}) {
  return new VADDetector(options);
}

