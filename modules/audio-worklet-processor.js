/**
 * AudioWorklet 音频处理器
 * 使用 AudioWorklet API 替代已废弃的 ScriptProcessor
 * 提供更高效、低延迟的实时音频处理
 */

/**
 * AudioWorklet 处理器代码（作为字符串，用于动态注册）
 */
export const AUDIO_WORKLET_PROCESSOR_CODE = `
class AudioWorkletProcessorImpl extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions?.bufferSize || 4096;
    this.sampleRate = options.processorOptions?.sampleRate || 16000;
    this.chunkInterval = options.processorOptions?.chunkInterval || 200; // ms
    this.samplesPerChunk = Math.floor(this.sampleRate * this.chunkInterval / 1000);
    this.accumulatedSamples = [];
    this.lastChunkTime = currentTime;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const inputChannel = input[0];
      
      // 累积样本
      this.accumulatedSamples.push(...inputChannel);
      
      // 检查是否达到 chunk 大小
      const currentTimeMs = currentTime * 1000;
      if (this.accumulatedSamples.length >= this.samplesPerChunk ||
          (currentTimeMs - this.lastChunkTime) >= this.chunkInterval) {
        
        // 提取 chunk
        const chunk = this.accumulatedSamples.slice(0, this.samplesPerChunk);
        this.accumulatedSamples = this.accumulatedSamples.slice(this.samplesPerChunk);
        this.lastChunkTime = currentTimeMs;
        
        // 转换为 Int16 PCM
        const int16Array = new Int16Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          const s = Math.max(-1, Math.min(1, chunk[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // 发送到主线程
        this.port.postMessage({
          type: 'audio-chunk',
          data: int16Array.buffer,
          timestamp: currentTimeMs,
          sampleRate: this.sampleRate,
        });
      }
    }
    
    return true; // 保持处理器活跃
  }
}

registerProcessor('audio-worklet-processor', AudioWorkletProcessorImpl);
`;

/**
 * 创建 AudioWorklet 音频流处理器
 * @param {Object} options - 配置选项
 * @param {Function} options.onAudioChunk - 音频 chunk 回调函数
 * @param {number} options.sampleRate - 采样率（默认 16000）
 * @param {number} options.chunkInterval - chunk 间隔（毫秒，默认 200ms）
 * @returns {Promise<AudioWorkletProcessor>} 处理器实例
 */
export async function createAudioWorkletProcessor(options = {}) {
  const {
    onAudioChunk,
    sampleRate = 16000,
    chunkInterval = 200,
  } = options;

  try {
    // 获取麦克风权限和音频流
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: sampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // 创建 AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: sampleRate,
    });

    // 创建 AudioWorkletNode
    // 注意：需要先注册 AudioWorklet 处理器
    const blob = new Blob([AUDIO_WORKLET_PROCESSOR_CODE], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    
    await audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    // 创建音频源
    const source = audioContext.createMediaStreamSource(stream);

    // 创建 AudioWorkletNode
    const workletNode = new AudioWorkletNode(audioContext, 'audio-worklet-processor', {
      processorOptions: {
        sampleRate: sampleRate,
        chunkInterval: chunkInterval,
      }
    });

    // 连接音频节点
    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    // 处理音频 chunk 消息
    workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio-chunk' && onAudioChunk) {
        const int16Array = new Int16Array(event.data.data);
        onAudioChunk({
          data: int16Array,
          timestamp: event.data.timestamp,
          sampleRate: event.data.sampleRate,
          format: 'pcm',
        });
      }
    };

    return {
      stream,
      audioContext,
      workletNode,
      start: () => {
        console.log('✅ AudioWorklet 处理器已启动');
      },
      stop: () => {
        workletNode.disconnect();
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        console.log('✅ AudioWorklet 处理器已停止');
      },
      pause: () => {
        audioContext.suspend();
      },
      resume: () => {
        audioContext.resume();
      },
    };
  } catch (error) {
    console.error('❌ 创建 AudioWorklet 处理器失败:', error);
    // 如果 AudioWorklet 不支持，降级到 ScriptProcessor
    if (error.name === 'NotSupportedError' || !window.AudioWorklet) {
      console.warn('⚠️ AudioWorklet 不支持，降级到 ScriptProcessor');
      const { createAudioStreamProcessor } = await import('./audio-stream-processor.js');
      return createAudioStreamProcessor(options);
    }
    throw error;
  }
}

/**
 * AudioWorklet 处理器类（面向对象方式）
 */
export class AudioWorkletProcessor {
  constructor(options = {}) {
    this.options = options;
    this.stream = null;
    this.audioContext = null;
    this.workletNode = null;
    this.isRunning = false;
  }

  /**
   * 启动音频流处理
   */
  async start() {
    if (this.isRunning) {
      console.warn('⚠️ AudioWorklet 处理器已在运行');
      return;
    }

    const processor = await createAudioWorkletProcessor({
      ...this.options,
      onAudioChunk: (chunk) => {
        if (this.options.onAudioChunk) {
          this.options.onAudioChunk(chunk);
        }
      },
    });

    this.stream = processor.stream;
    this.audioContext = processor.audioContext;
    this.workletNode = processor.workletNode;
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

    this.workletNode.disconnect();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isRunning = false;
    console.log('✅ AudioWorklet 处理器已停止');
  }

  pause() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

