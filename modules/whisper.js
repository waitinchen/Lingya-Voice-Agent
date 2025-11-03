/**
 * Faster-Whisper 語音識別模組
 * 將音頻轉換為文字
 */

import { WhisperModel } from 'faster-whisper';
import { config } from '../config/config.js';

let whisperModel = null;

/**
 * 初始化 Whisper 模型
 */
export async function initWhisper() {
  try {
    console.log('🎤 初始化 Whisper 模型...');
    whisperModel = await WhisperModel.fromModel(config.whisper.model, {
      device: config.whisper.device,
      computeType: config.whisper.device === 'cuda' ? 'float16' : 'int8',
    });
    console.log('✅ Whisper 模型載入完成');
    return whisperModel;
  } catch (error) {
    console.error('❌ Whisper 初始化失敗:', error);
    throw error;
  }
}

/**
 * 將音頻轉換為文字
 * @param {Buffer|ArrayBuffer|Float32Array} audioData - 音頻數據
 * @param {Object} options - 選項
 * @returns {Promise<string>} 識別的文字
 */
export async function transcribe(audioData, options = {}) {
  if (!whisperModel) {
    await initWhisper();
  }

  try {
    const {
      language = config.whisper.language,
      temperature = 0.0,
      beam_size = 5,
    } = options;

    const result = await whisperModel.transcribe(audioData, {
      language: language,
      temperature: temperature,
      beam_size: beam_size,
    });

    // 合併所有片段
    const text = result.segments
      .map((segment) => segment.text)
      .join(' ')
      .trim();

    return text;
  } catch (error) {
    console.error('❌ 語音識別失敗:', error);
    throw error;
  }
}

/**
 * 獲取模型實例（用於進階操作）
 */
export function getModel() {
  return whisperModel;
}

