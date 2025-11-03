import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // 伺服器
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // LLM 配置
  llm: {
    provider: process.env.LLM_PROVIDER || 'ollama',
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    },
  },

  // Whisper 配置
  whisper: {
    model: process.env.WHISPER_MODEL || 'base',
    device: process.env.WHISPER_DEVICE || 'cpu',
    language: process.env.WHISPER_LANGUAGE || 'zh',
  },

  // XTTS 配置
  tts: {
    model: process.env.XTTS_MODEL || 'tts_models/multilingual/multi-dataset/xtts_v2',
    lang: process.env.XTTS_LANG || 'zh',
    device: process.env.XTTS_DEVICE || 'cpu',
  },

  // 語音流配置
  audio: {
    sampleRate: parseInt(process.env.SAMPLE_RATE) || 24000,
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 1024,
  },
};

