/**
 * WebSocket 集成測試
 * 測試完整的語音對話流程
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/api/voice-ws';
const TEST_AUDIO_BASE64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA='; // 空音頻（用於測試）

console.log(`🔌 連接到: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket 連接成功');
  
  // 發送連接消息
  ws.send(JSON.stringify({
    type: 'connect',
    data: {
      language: 'zh',
      userIdentity: 'test',
      userName: '測試用戶'
    }
  }));
  
  // 等待一下，然後發送測試音頻
  setTimeout(() => {
    console.log('📤 發送測試音頻片段...');
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: {
        audio: TEST_AUDIO_BASE64,
        format: 'webm',
        sampleRate: 44100,
        channels: 1
      }
    }));
    
    // 發送結束消息
    setTimeout(() => {
      console.log('📤 發送 audio_end...');
      ws.send(JSON.stringify({
        type: 'audio_end',
        data: {
          finalize: true
        }
      }));
    }, 1000);
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`📥 收到消息: ${message.type}`, message.data || message.error);
    
    if (message.type === 'connected') {
      console.log(`✅ 會話已建立: ${message.data?.sessionId}`);
    } else if (message.type === 'error') {
      console.error(`❌ 錯誤: ${message.error?.code} - ${message.error?.message}`);
    }
  } catch (error) {
    console.error('❌ 解析消息失敗:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket 錯誤:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 連接關閉: code=${code}, reason=${reason}`);
  process.exit(0);
});

// 超時處理
setTimeout(() => {
  console.log('⏰ 測試超時');
  ws.close();
  process.exit(1);
}, 30000);

