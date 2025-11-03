/**
 * 即時語音流處理模組
 * 處理 WebRTC 或 WebSocket 語音串流
 */

import { config } from '../config/config.js';
import { transcribe } from './whisper.js';
import { generateResponse, analyzeEmotion } from './llm.js';
import { synthesize } from './tts.js';

/**
 * 處理語音流並返回回應
 * @param {Buffer|ArrayBuffer} audioChunk - 音頻片段
 * @param {Object} context - 對話上下文
 * @returns {Promise<Object>} 包含回應音頻和文字的物件
 */
export async function processVoiceStream(audioChunk, context = {}) {
  try {
    // 1. 語音識別 (STT)
    console.log('🎤 正在識別語音...');
    const transcribedText = await transcribe(audioChunk, {
      language: context.language || 'zh',
    });

    if (!transcribedText || transcribedText.trim().length === 0) {
      return {
        text: '',
        audio: null,
        error: '未識別到語音',
      };
    }

    console.log(`📝 識別結果: ${transcribedText}`);

    // 2. 分析情緒
    const emotion = await analyzeEmotion(transcribedText);
    console.log(`😊 檢測情緒: ${emotion}`);

    // 3. LLM 生成回應
    console.log('🤖 正在生成回應...');
    const conversationHistory = context.history || [];
    const responseText = await generateResponse(
      transcribedText,
      conversationHistory,
      {
        emotion,
        tone: context.tone || '自然',
        temperature: context.temperature || 0.7,
      }
    );

    console.log(`💬 AI 回應: ${responseText}`);

    // 4. 語音合成 (TTS)
    console.log('🔊 正在合成語音...');
    const audioResponse = await synthesize(responseText, {
      emotion,
      lang: context.language || 'zh',
    });

    // 5. 更新對話歷史
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: transcribedText },
      { role: 'assistant', content: responseText },
    ];

    return {
      text: responseText,
      audio: audioResponse,
      emotion,
      history: updatedHistory,
    };
  } catch (error) {
    console.error('❌ 語音流處理失敗:', error);
    return {
      text: '',
      audio: null,
      error: error.message,
    };
  }
}

/**
 * 處理連續語音流（用於實時對話）
 */
export class VoiceStreamProcessor {
  constructor() {
    this.conversationHistory = [];
    this.currentEmotion = '平靜';
  }

  /**
   * 處理新的音頻片段
   */
  async processChunk(audioChunk, options = {}) {
    const result = await processVoiceStream(audioChunk, {
      history: this.conversationHistory,
      emotion: this.currentEmotion,
      ...options,
    });

    // 更新狀態
    if (result.history) {
      this.conversationHistory = result.history;
    }
    if (result.emotion) {
      this.currentEmotion = result.emotion;
    }

    return result;
  }

  /**
   * 重置對話歷史
   */
  reset() {
    this.conversationHistory = [];
    this.currentEmotion = '平靜';
  }

  /**
   * 獲取當前對話狀態
   */
  getState() {
    return {
      history: this.conversationHistory,
      emotion: this.currentEmotion,
    };
  }
}

