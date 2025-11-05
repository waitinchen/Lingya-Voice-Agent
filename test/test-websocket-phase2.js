/**
 * WebSocket Phase 2 測試腳本
 * 測試音頻處理和 STT 功能
 */

import WebSocket from "ws";
import fs from "fs";
import path from "path";

const WS_URL = process.env.WS_URL || "ws://localhost:3000/api/voice-ws";

console.log("🔌 連接到 WebSocket 服務器:", WS_URL);

const ws = new WebSocket(WS_URL);

let testAudioBase64 = null;

// 嘗試載入一個測試音頻文件（如果存在）
try {
  const testAudioPath = path.join(process.cwd(), "tmp", "test-audio.webm");
  if (fs.existsSync(testAudioPath)) {
    const audioBuffer = fs.readFileSync(testAudioPath);
    testAudioBase64 = audioBuffer.toString("base64");
    console.log("✅ 載入測試音頻文件");
  }
} catch (error) {
  console.log("ℹ️  沒有測試音頻文件，將使用模擬數據");
}

ws.on("open", () => {
  console.log("✅ WebSocket 連接已建立\n");

  // 測試 1: 發送 connect 消息
  console.log("📤 測試 1: 發送 connect 消息");
  ws.send(
    JSON.stringify({
      type: "connect",
      data: {
        language: "zh",
        userIdentity: "dad",
        userName: "陳威廷",
      },
    })
  );
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.type) {
      case "connected":
        console.log("✅ 連接確認收到，sessionId:", msg.data.sessionId);
        console.log("📋 功能列表:", msg.data.capabilities);
        console.log("\n");

        // 測試 2: 發送音頻片段（如果沒有測試音頻，跳過）
        if (!testAudioBase64) {
          console.log("⚠️  沒有測試音頻，跳過音頻測試");
          console.log("💡 提示：創建一個音頻文件到 tmp/test-audio.webm 可以進行完整測試\n");
          setTimeout(() => {
            ws.close();
          }, 1000);
          return;
        }

        console.log("📤 測試 2: 發送音頻片段（模擬）");
        // 模擬發送多個音頻片段
        const chunkSize = Math.floor(testAudioBase64.length / 3);
        for (let i = 0; i < 3; i++) {
          const chunk = testAudioBase64.slice(i * chunkSize, (i + 1) * chunkSize);
          setTimeout(() => {
            ws.send(
              JSON.stringify({
                type: "audio_chunk",
                id: `chunk-${i + 1}`,
                data: {
                  audio: chunk,
                  format: "webm",
                  sampleRate: 44100,
                  channels: 1,
                },
              })
            );
            console.log(`   📤 發送音頻片段 ${i + 1}/3`);
          }, i * 500);
        }

        // 測試 3: 發送 audio_end
        setTimeout(() => {
          console.log("\n📤 測試 3: 發送 audio_end");
          ws.send(
            JSON.stringify({
              type: "audio_end",
              data: {
                finalize: true,
              },
            })
          );
        }, 2000);
        break;

      case "status":
        console.log(`📊 狀態更新: ${msg.data.stage} - ${msg.data.message}`);
        break;

      case "transcription_final":
        console.log("\n✅ 收到最終識別結果:");
        console.log(`   文字: "${msg.data.text}"`);
        console.log(`   置信度: ${msg.data.confidence}`);
        if (msg.data.emotion) {
          console.log(`   情緒: ${msg.data.emotion}`);
        }
        console.log("\n✅ Phase 2 測試通過！\n");
        setTimeout(() => {
          ws.close();
        }, 1000);
        break;

      case "error":
        console.error("❌ 收到錯誤:", msg.error);
        setTimeout(() => {
          ws.close();
        }, 1000);
        break;

      default:
        console.log(`ℹ️  收到消息: ${msg.type}`);
    }
  } catch (error) {
    console.error("❌ 解析消息失敗:", error);
  }
});

ws.on("error", (error) => {
  console.error("❌ WebSocket 錯誤:", error);
});

ws.on("close", (code, reason) => {
  console.log(`\n🔌 WebSocket 連接已關閉 (code: ${code})`);
  console.log("✅ 測試完成");
  process.exit(0);
});

// 超時處理（60 秒）
setTimeout(() => {
  console.log("\n⏰ 測試超時，關閉連接");
  ws.close();
}, 60000);

