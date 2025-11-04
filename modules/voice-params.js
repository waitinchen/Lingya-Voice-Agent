/**
 * 語氣標籤 → 聲音參數轉譯層
 * Emotion-to-Voice Parameter Mapping Layer
 * 讓花小軟真正「理解」語氣標籤對應的聲音參數控制邏輯
 */

// ========================================
// 🩵 語氣標籤映射表（Emotion-to-Voice Mapping）
// ========================================
// 定義每個語氣標籤對應的聲音參數（pitch、rate、volume）
// pitch: 音高調整（-4 到 +4，0 為中性）
// rate: 語速倍數（0.7-1.4，1.0 為正常速度）
// volume: 音量倍數（0.4-1.2，1.0 為正常音量）

export const emotionMap = {
  // 核心情緒標籤
  warm: {
    pitch: -1,
    rate: 0.9,
    volume: 0.8,
    description: "溫暖安撫：降低音高、放慢語速、適度音量"
  },
  flirty: {
    pitch: +2,
    rate: 1.1,
    volume: 0.8,
    description: "撒嬌：提升尾音音高、稍快語速、輕柔音量"
  },
  angry: {
    pitch: +3,
    rate: 1.3,
    volume: 1.0,
    description: "生氣：提高音高與速度、增強音量"
  },
  tender: {
    pitch: -2,
    rate: 0.85,
    volume: 0.6,
    description: "溫柔感動：降低音高、慢語速、輕音量"
  },
  excited: {
    pitch: +2,
    rate: 1.2,
    volume: 0.9,
    description: "興奮：提升音高、快語速、中高音量"
  },
  whisper: {
    pitch: 0,
    rate: 0.8,
    volume: 0.4,
    description: "耳語：保持音高、慢語速、極輕音量"
  },
  playful: {
    pitch: +1,
    rate: 1.15,
    volume: 0.85,
    description: "驕傲可愛：微升音高、稍快語速、適中音量"
  },
  thoughtful: {
    pitch: -1,
    rate: 0.95,
    volume: 0.7,
    description: "認真思考：降低音高、正常偏慢、適中音量"
  },
  emotional: {
    pitch: +1,
    rate: 1.0,
    volume: 0.9,
    description: "情感豐富：微升音高、正常語速、高音量"
  },
  breathy: {
    pitch: -0.5,
    rate: 0.9,
    volume: 0.75,
    description: "帶呼吸感：略降音高、稍慢語速、輕柔音量"
  },
  softer: {
    pitch: -1.5,
    rate: 0.88,
    volume: 0.65,
    description: "更溫柔：明顯降低音高、慢語速、輕音量"
  },
  smile: {
    pitch: +1.5,
    rate: 1.05,
    volume: 0.85,
    description: "帶笑感：提升音高、稍快語速、適中音量"
  },
  // 控制標籤（直接調整參數）
  fast: {
    pitch: 0,
    rate: 1.3,
    volume: 1.0,
    description: "快速：正常音高、快速語速、正常音量"
  },
  slow: {
    pitch: 0,
    rate: 0.7,
    volume: 1.0,
    description: "慢速：正常音高、慢語速、正常音量"
  },
  louder: {
    pitch: 0,
    rate: 1.0,
    volume: 1.2,
    description: "更大聲：正常音高、正常語速、高音量"
  },
  quieter: {
    pitch: 0,
    rate: 1.0,
    volume: 0.5,
    description: "更小聲：正常音高、正常語速、低音量"
  },
  neutral: {
    pitch: 0,
    rate: 1.0,
    volume: 1.0,
    description: "中性：所有參數為默認值"
  },
};

// ========================================
// 🧠 參數融合器（Parameter Fusion）
// ========================================
/**
 * 將多個語氣標籤融合為最終的聲音參數
 * @param {Array<string>} tags - 語氣標籤列表
 * @returns {Object} { pitch, rate, volume, description }
 */
export function mergeVoiceParams(tags = []) {
  // 基礎參數（中性）
  let params = {
    pitch: 0,
    rate: 1.0,
    volume: 1.0,
  };
  
  const appliedTags = [];
  
  // 處理每個標籤
  for (const tag of tags) {
    const t = tag.toLowerCase().trim();
    
    // 跳過 pause-XXX 標籤（這些由其他模組處理）
    if (/^pause-\d{2,4}$/.test(t)) {
      continue;
    }
    
    if (emotionMap[t]) {
      const e = emotionMap[t];
      
      // 融合參數
      // pitch: 累加（帶權重）
      params.pitch += e.pitch * 0.3;
      
      // rate: 乘積（多個標籤會疊加效果）
      params.rate *= e.rate;
      
      // volume: 乘積（多個標籤會疊加效果）
      params.volume *= e.volume;
      
      appliedTags.push(t);
    }
  }
  
  // 限制參數範圍（安全欄）
  params.pitch = Math.max(-4, Math.min(4, params.pitch));
  params.rate = Math.max(0.7, Math.min(1.4, params.rate));
  params.volume = Math.max(0.4, Math.min(1.2, params.volume));
  
  // 生成描述
  const descriptions = appliedTags
    .map(t => emotionMap[t]?.description || t)
    .join("；");
  
  return {
    ...params,
    appliedTags,
    description: descriptions || "中性（默認參數）",
  };
}

/**
 * 獲取語氣標籤的聲音參數描述
 * @param {Array<string>} tags - 語氣標籤列表
 * @returns {string} 聲音參數的文本描述
 */
export function getVoiceParamsDescription(tags = []) {
  const params = mergeVoiceParams(tags);
  return `🎙️ 聲音參數：pitch=${params.pitch.toFixed(2)}, rate=${params.rate.toFixed(2)}, volume=${params.volume.toFixed(2)} | ${params.description}`;
}



