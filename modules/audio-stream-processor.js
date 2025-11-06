/**
 * 实时音频流处理器
 * 使用 AudioContext 实现更高效的实时音频捕获和处理
 * 
 * 相比 MediaRecorder，AudioContext 提供：
 * - 更低的延迟
 * - 更精确的音频控制
 * - 实时处理能力
 */

/**
 * 创建实时音频流处理器
 * @param {Object} options - 配置选项
 * @param {Function} options.onAudioChunk - 音频 chunk 回调函数 (chunk) => void
 * @param {number} options.sampleRate - 采样率（默认 16000，适合语音识别）
 * @param {number} options.chunkSize - chunk 大小（毫秒，默认 200ms）
 * @returns {Promise<AudioStreamProcessor>} 音频流处理器实例
 */
export async function createAudioStreamProcessor(options = {}) {
  const {
    onAudioChunk,
    sampleRate = 16000, // Whisper 推荐 16kHz
    chunkSize = 200, // 200ms chunks
  } = options;

  try {
    // 获取麦克风权限和音频流
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: sampleRate,
        channelCount: 1, // 单声道
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // 创建 AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: sampleRate,
    });

    // 创建音频源
    const source = audioContext.createMediaStreamSource(stream);

    // 创建 ScriptProcessor（用于实时处理音频）
    // 注意：ScriptProcessor 已废弃，但为了兼容性暂时使用
    // 未来可以改用 AudioWorklet
    const bufferSize = Math.floor(sampleRate * chunkSize / 1000); // 每 chunk 的样本数
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    // 连接音频节点
    source.connect(processor);
    processor.connect(audioContext.destination);

    // 音频处理回调
    processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0); // 获取第一个声道的数据

      // 将 Float32Array 转换为 Int16Array (PCM 格式)
      const pcmData = convertFloat32ToInt16(inputData);

      // 调用回调函数
      if (onAudioChunk && typeof onAudioChunk === 'function') {
        onAudioChunk({
          data: pcmData,
          timestamp: Date.now(),
          sampleRate: sampleRate,
          format: 'pcm',
        });
      }
    };

    return {
      stream,
      audioContext,
      processor,
      start: () => {
        console.log('✅ 实时音频流处理器已启动');
      },
      stop: () => {
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        console.log('✅ 实时音频流处理器已停止');
      },
      pause: () => {
        audioContext.suspend();
      },
      resume: () => {
        audioContext.resume();
      },
    };
  } catch (error) {
    console.error('❌ 创建音频流处理器失败:', error);
    throw error;
  }
}

/**
 * 将 Float32Array 转换为 Int16Array (PCM 16-bit)
 * @param {Float32Array} float32Array - Float32 音频数据
 * @returns {Int16Array} Int16 PCM 数据
 */
function convertFloat32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // 将 [-1, 1] 范围的浮点数转换为 [-32768, 32767] 范围的整数
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

/**
 * 将 Int16Array PCM 数据转换为 Base64
 * @param {Int16Array} pcmData - PCM 数据
 * @returns {string} Base64 编码的字符串
 */
export function encodePCMToBase64(pcmData) {
  // 将 Int16Array 转换为 ArrayBuffer
  const buffer = pcmData.buffer;
  // 转换为 Base64
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return btoa(binary);
}

/**
 * 音频流处理器类（面向对象方式）
 */
export class AudioStreamProcessor {
  constructor(options = {}) {
    this.options = options;
    this.stream = null;
    this.audioContext = null;
    this.processor = null;
    this.isRunning = false;
  }

  /**
   * 启动音频流处理
   */
  async start() {
    if (this.isRunning) {
      console.warn('⚠️ 音频流处理器已在运行');
      return;
    }

    const processor = await createAudioStreamProcessor({
      ...this.options,
      onAudioChunk: (chunk) => {
        if (this.options.onAudioChunk) {
          this.options.onAudioChunk(chunk);
        }
      },
    });

    this.stream = processor.stream;
    this.audioContext = processor.audioContext;
    this.processor = processor.processor;
    this.isRunning = true;

    processor.start();
  }

  /**
   * 停止音频流处理
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.processor.disconnect();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isRunning = false;
    console.log('✅ 音频流处理器已停止');
  }

  /**
   * 暂停音频流处理
   */
  pause() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  /**
   * 恢复音频流处理
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

