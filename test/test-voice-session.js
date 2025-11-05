/**
 * VoiceSession 單元測試
 * 測試會話管理功能（使用原生 Node.js）
 */

import { VoiceSession, SessionState } from "../modules/voice-session.js";
import { describe, test, expect, run } from "./test-runner.js";

// Mock WebSocket
class MockWebSocket {
  constructor() {
    this.readyState = 1; // WebSocket.OPEN
    this.sendCalls = [];
    this.closeCalls = [];
    
    this.send = (data) => {
      this.sendCalls.push(data);
    };
    
    this.close = () => {
      this.closeCalls.push(true);
      this.readyState = 3; // WebSocket.CLOSED
    };
  }
}

describe("VoiceSession", () => {
  let session;
  let mockWs;

  // 使用簡單的 beforeEach 替代
  function createSession() {
    mockWs = new MockWebSocket();
    session = new VoiceSession(mockWs);
  }

  test("應該創建會話並初始化為 IDLE 狀態", () => {
    createSession();
    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.currentState).toBe(SessionState.IDLE);
    expect(session.audioBuffer).toEqual([]);
    expect(session.conversationHistory).toEqual([]);
  });

  test("應該能夠設置狀態", () => {
    createSession();
    session.setState(SessionState.LISTENING);
    expect(session.currentState).toBe(SessionState.LISTENING);

    session.setState(SessionState.THINKING);
    expect(session.currentState).toBe(SessionState.THINKING);
  });

  test("應該能夠添加音頻片段", () => {
    createSession();
    const chunk1 = Buffer.from("audio chunk 1");
    const chunk2 = Buffer.from("audio chunk 2");

    session.addAudioChunk(chunk1);
    session.addAudioChunk(chunk2);

    expect(session.audioBuffer.length).toBe(2);
    expect(session.audioBuffer[0]).toBe(chunk1);
    expect(session.audioBuffer[1]).toBe(chunk2);
  });

  test("應該能夠清空音頻緩衝區", () => {
    createSession();
    session.addAudioChunk(Buffer.from("chunk 1"));
    session.addAudioChunk(Buffer.from("chunk 2"));

    expect(session.audioBuffer.length).toBe(2);

    session.clearAudioBuffer();

    expect(session.audioBuffer.length).toBe(0);
  });

  test("應該能夠添加對話歷史", () => {
    createSession();
    const message1 = { role: "user", content: "你好" };
    const message2 = { role: "assistant", content: "你好！" };

    session.addToHistory(message1);
    session.addToHistory(message2);

    expect(session.conversationHistory.length).toBe(2);
    expect(session.conversationHistory[0]).toEqual(message1);
    expect(session.conversationHistory[1]).toEqual(message2);
  });

  test("應該能夠重置會話", () => {
    createSession();
    session.setState(SessionState.THINKING);
    session.addAudioChunk(Buffer.from("chunk"));
    session.addToHistory({ role: "user", content: "test" });
    session.currentTranscription = "測試";
    session.currentLLMResponse = "回應";
    session.currentTags = ["warm"];

    session.reset();

    expect(session.currentState).toBe(SessionState.IDLE);
    expect(session.audioBuffer.length).toBe(0);
    expect(session.conversationHistory.length).toBe(0);
    expect(session.currentTranscription).toBe("");
    expect(session.currentLLMResponse).toBe("");
    expect(session.currentTags).toEqual([]);
  });

  test("應該能夠檢查是否活躍", () => {
    createSession();
    expect(session.isAlive()).toBe(true);

    // 模擬連接關閉
    mockWs.readyState = 3; // WebSocket.CLOSED
    expect(session.isAlive()).toBe(false);
  });

  test("應該能夠處理打斷", () => {
    createSession();
    session.setState(SessionState.THINKING);
    session.currentLLMResponse = "正在生成...";
    session.currentTags = ["warm"];

    session.interrupt("user_interrupt");

    expect(session.isInterrupted).toBe(true);
    expect(session.currentState).toBe(SessionState.IDLE);
    expect(session.currentLLMResponse).toBe("");
    expect(session.currentTags).toEqual([]);
  });

  test("應該能夠獲取狀態信息", () => {
    createSession();
    session.setState(SessionState.LISTENING);
    session.userIdentity = "test_user";
    session.userName = "測試用戶";

    const state = session.getState();

    expect(state).toHaveProperty("sessionId");
    expect(state).toHaveProperty("state");
    expect(state.state).toBe(SessionState.LISTENING);
    expect(state.userIdentity).toBe("test_user");
    expect(state.userName).toBe("測試用戶");
    expect(state.audioBufferSize).toBe(0);
    expect(state.historyLength).toBe(0);
    expect(state.isInterrupted).toBe(false);
  });

  test("應該能夠管理 AbortController", () => {
    createSession();
    expect(session.abortController).toBeNull();

    session.createAbortController();
    expect(session.abortController).toBeDefined();
    expect(session.abortController.signal).toBeDefined();

    const signal = session.getAbortSignal();
    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(false);

    // 測試中止
    session.abortController.abort();
    expect(signal.aborted).toBe(true);
  });
});

// 運行測試
run().catch((error) => {
  console.error("❌ 測試運行失敗:", error);
  process.exit(1);
});
