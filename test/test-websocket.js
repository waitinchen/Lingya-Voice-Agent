/**
 * WebSocket 連接測試腳本
 * 測試 Phase 1 基礎架構功能
 */

import WebSocket from "ws";

const WS_URL = process.env.WS_URL || "ws://localhost:3000/api/voice-ws";

console.log("🔌 連接到 WebSocket 服務器:", WS_URL);

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("✅ WebSocket 連接已建立");

  // 測試 1: 發送 connect 消息
  console.log("\n📤 測試 1: 發送 connect 消息");
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
    console.log("\n📥 收到消息:", JSON.stringify(msg, null, 2));

    // 處理不同類型的消息
    switch (msg.type) {
      case "connected":
        console.log("✅ 連接確認收到，sessionId:", msg.data.sessionId);
        
        // 測試 2: 發送 ping
        console.log("\n📤 測試 2: 發送 ping");
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              type: "ping",
              timestamp: Date.now(),
            })
          );
        }, 1000);
        break;

      case "pong":
        console.log("✅ ping/pong 測試通過");
        
        // 測試 3: 發送 reset
        console.log("\n📤 測試 3: 發送 reset");
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              type: "reset",
              data: {
                clearHistory: true,
              },
            })
          );
        }, 1000);
        break;

      case "reset_complete":
        console.log("✅ reset 測試通過");
        
        // 測試 4: 發送 audio_chunk（模擬）
        console.log("\n📤 測試 4: 發送 audio_chunk（模擬）");
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              type: "audio_chunk",
              id: "test-chunk-1",
              data: {
                audio: "base64-encoded-audio-chunk",
                format: "webm",
                sampleRate: 44100,
                channels: 1,
              },
            })
          );
          
          // 測試 5: 發送 audio_end
          setTimeout(() => {
            console.log("\n📤 測試 5: 發送 audio_end");
            ws.send(
              JSON.stringify({
                type: "audio_end",
                data: {
                  finalize: true,
                },
              })
            );
          }, 1000);
        }, 1000);
        break;

      case "status":
        console.log("✅ 收到狀態更新:", msg.data);
        break;

      case "error":
        console.error("❌ 收到錯誤:", msg.error);
        break;

      default:
        console.log("ℹ️  收到未知消息類型:", msg.type);
    }
  } catch (error) {
    console.error("❌ 解析消息失敗:", error);
  }
});

ws.on("error", (error) => {
  console.error("❌ WebSocket 錯誤:", error);
});

ws.on("close", (code, reason) => {
  console.log(`\n🔌 WebSocket 連接已關閉 (code: ${code}, reason: ${reason})`);
  console.log("\n✅ 所有測試完成");
  process.exit(0);
});

// 超時處理（30 秒後自動關閉）
setTimeout(() => {
  console.log("\n⏰ 測試超時，關閉連接");
  ws.close();
}, 30000);

