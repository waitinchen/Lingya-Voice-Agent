/**
 * 增量 STT 处理模块
 * 支持实时音频流的增量语音识别
 * 
 * 注意：OpenAI Whisper API 本身不支持增量识别，
 * 本模块通过累积音频 chunks 并定期调用 API 来模拟增量行为
 */

import { transcribeFromBase64 } from "./stt.js";

/**
 * 增量 STT 处理器
 */
export class IncrementalSTTProcessor {
  constructor(options = {}) {
    this.options = {
      // 每次 STT 调用的最小音频时长（秒）
      minChunkDuration: 1.0,
      // 最大累积时长（秒），超过此值强制处理
      maxAccumulateDuration: 3.0,
      // 样本率
      sampleRate: 16000,
      // 语言
      language: options.language || "zh",
      // 回调函数
      onPartial: null, // (text: string) => void
      onFinal: null, // (text: string) => void
      ...options,
    };
    
    this.audioChunks = [];
    this.lastProcessTime = null;
    this.isProcessing = false;
    this.pendingChunks = [];
  }

  /**
   * 添加音频 chunk
   * @param {Object} chunk - 音频 chunk
   * @param {string} chunk.audio - Base64 编码的音频数据
   * @param {string} chunk.format - 音频格式 (webm, mp4, pcm, etc.)
   * @param {number} chunk.timestamp - 时间戳
   */
  async addChunk(chunk) {
    const { audio, format, timestamp } = chunk;
    
    if (!audio) {
      console.warn("⚠️ 音频 chunk 缺少 audio 字段");
      return;
    }

    // 添加到累积缓冲区
    this.audioChunks.push({
      audio,
      format: format || "webm",
      timestamp: timestamp || Date.now(),
    });

    // 计算累积时长
    const accumulateDuration = this.estimateDuration(this.audioChunks);
    
    // 检查是否需要处理
    const shouldProcess = 
      accumulateDuration >= this.options.minChunkDuration ||
      (accumulateDuration >= this.options.maxAccumulateDuration);

    if (shouldProcess && !this.isProcessing) {
      await this.processAccumulated();
    }
  }

  /**
   * 处理累积的音频 chunks
   */
  async processAccumulated() {
    if (this.audioChunks.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const chunksToProcess = [...this.audioChunks];
    this.audioChunks = []; // 清空缓冲区

    try {
      // 合并音频 chunks
      const mergedAudio = await this.mergeChunks(chunksToProcess);
      
      // 调用 STT
      const transcribedText = await transcribeFromBase64(
        mergedAudio,
        {
          language: this.options.language,
        }
      );

      if (transcribedText && transcribedText.trim()) {
        // 发送增量结果
        if (this.options.onPartial && typeof this.options.onPartial === 'function') {
          this.options.onPartial(transcribedText);
        }
      }

      this.lastProcessTime = Date.now();
    } catch (error) {
      console.error("❌ 增量 STT 处理失败:", error);
      // 发生错误时，将 chunks 放回缓冲区（避免丢失）
      this.audioChunks.unshift(...chunksToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 完成录音，处理剩余的音频
   */
  async finalize() {
    // 处理所有剩余的 chunks
    if (this.audioChunks.length > 0) {
      await this.processAccumulated();
    }

    // 调用最终回调
    if (this.options.onFinal && typeof this.options.onFinal === 'function') {
      // 这里可以发送最终结果（如果有的话）
      // 由于我们已经在 onPartial 中发送了结果，这里主要是标记完成
      this.options.onFinal(null);
    }
  }

  /**
   * 重置处理器
   */
  reset() {
    this.audioChunks = [];
    this.lastProcessTime = null;
    this.isProcessing = false;
    this.pendingChunks = [];
  }

  /**
   * 估算音频时长（粗略）
   * @param {Array} chunks - 音频 chunks
   * @returns {number} 估算的时长（秒）
   */
  estimateDuration(chunks) {
    if (chunks.length === 0) return 0;
    
    // 根据 Base64 数据大小粗略估算
    // 假设 WebM 格式，16kHz，单声道
    // 大约 1KB = 0.1秒
    const totalSize = chunks.reduce((sum, chunk) => {
      return sum + (chunk.audio ? chunk.audio.length : 0);
    }, 0);
    
    // 粗略估算：Base64 编码后，实际数据约是编码数据的 3/4
    // WebM 压缩后，实际时长会更长
    // 这里使用一个经验值：1KB Base64 ≈ 0.05秒
    return (totalSize / 1024) * 0.05;
  }

  /**
   * 合并音频 chunks
   * @param {Array} chunks - 音频 chunks
   * @returns {Promise<string>} Base64 编码的合并音频
   */
  async mergeChunks(chunks) {
    if (chunks.length === 0) {
      throw new Error("没有音频 chunks 可合并");
    }

    if (chunks.length === 1) {
      return chunks[0].audio;
    }

    // 尝试使用 ffmpeg 合并（如果可用），否则使用简单合并
    try {
      const { mergeAudioWithFFmpeg } = await import('./audio-ffmpeg.js');
      
      // 将 Base64 chunks 转换为 Buffer
      const audioChunks = chunks.map(chunk => ({
        audio: Buffer.from(chunk.audio, 'base64'),
        format: chunk.format || 'webm',
        sampleRate: 16000,
        channels: 1,
        timestamp: chunk.timestamp,
      }));
      
      // 使用 ffmpeg 合并
      const mergedBuffer = await mergeAudioWithFFmpeg(audioChunks, {
        outputFormat: chunks[0].format || 'webm',
        sampleRate: 16000,
        channels: 1,
      });
      
      // 转换回 Base64
      return mergedBuffer.toString('base64');
    } catch (error) {
      console.warn('⚠️ ffmpeg 合并失败，使用简单合并:', error.message);
      
      // 降级到简单合并
      const { mergeAudioChunks } = await import('./audio-processor.js');
      const audioChunks = chunks.map(chunk => ({
        audio: chunk.audio,
        format: chunk.format || 'webm',
        sampleRate: 16000,
        channels: 1,
        timestamp: chunk.timestamp,
      }));
      
      const mergedBuffer = await mergeAudioChunks(audioChunks);
      return mergedBuffer.toString('base64');
    }
  }
}

