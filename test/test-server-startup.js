/**
 * 服務器啟動測試
 * 驗證服務器能否正常啟動
 */

import { spawn } from 'child_process';
import http from 'http';

const PORT = process.env.PORT || 3001; // 使用不同的端口避免衝突

console.log('🧪 測試服務器啟動...');

// 啟動服務器進程
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: PORT },
  stdio: 'pipe'
});

let serverStarted = false;
let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log(output.trim());
  
  if (output.includes('Server started on port')) {
    serverStarted = true;
    console.log('✅ 服務器啟動成功');
    testHealthCheck();
  }
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.error('❌ 錯誤:', output.trim());
});

serverProcess.on('exit', (code) => {
  if (code !== 0 && !serverStarted) {
    console.error('❌ 服務器啟動失敗');
    console.error('輸出:', serverOutput);
    process.exit(1);
  }
});

function testHealthCheck() {
  console.log('🧪 測試健康檢查端點...');
  
  const req = http.get(`http://localhost:${PORT}/`, (res) => {
    console.log(`✅ HTTP 響應: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ 服務器正常運行');
      serverProcess.kill();
      process.exit(0);
    } else {
      console.error(`❌ 意外的狀態碼: ${res.statusCode}`);
      serverProcess.kill();
      process.exit(1);
    }
  });
  
  req.on('error', (error) => {
    console.error('❌ HTTP 請求失敗:', error.message);
    serverProcess.kill();
    process.exit(1);
  });
  
  req.setTimeout(5000, () => {
    console.error('❌ 請求超時');
    req.destroy();
    serverProcess.kill();
    process.exit(1);
  });
}

// 超時處理
setTimeout(() => {
  if (!serverStarted) {
    console.error('❌ 服務器啟動超時');
    serverProcess.kill();
    process.exit(1);
  }
}, 10000);

