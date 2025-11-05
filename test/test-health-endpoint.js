/**
 * 健康檢查端點測試
 * 測試 /health 端點的功能（使用原生 Node.js）
 */

import http from "http";
import { describe, test, expect, run } from "./test-runner.js";

const PORT = process.env.PORT || 3000;
const HEALTH_URL = `http://localhost:${PORT}/health`;

// 輔助函數：發送 HTTP GET 請求
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, data });
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

describe("Health Endpoint", () => {
  test("應該返回健康狀態", async () => {
    try {
      const response = await httpGet(HEALTH_URL);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");

      const health = JSON.parse(response.data);
      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("timestamp");
      expect(health).toHaveProperty("uptime");
      expect(health).toHaveProperty("websocket");
      expect(health).toHaveProperty("environment");
      expect(health).toHaveProperty("version");

      expect(health.status).toBe("ok");
      expect(typeof health.uptime).toBe("number");
      expect(["enabled", "disabled"]).toContain(health.websocket);
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        console.log("  ⏭️  跳過（服務器未運行）");
        console.log("  💡 提示：請先啟動服務器（npm start）");
        return;
      }
      throw error;
    }
  });

  test("應該包含 WebSocket 統計（如果可用）", async () => {
    try {
      const response = await httpGet(HEALTH_URL);
      const health = JSON.parse(response.data);

      if (health.websocket === "enabled") {
        expect(health).toHaveProperty("websocket_stats");
        expect(health.websocket_stats).toHaveProperty("total");
        expect(health.websocket_stats).toHaveProperty("active");
        expect(typeof health.websocket_stats.total).toBe("number");
        expect(typeof health.websocket_stats.active).toBe("number");
      }
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        console.log("  ⏭️  跳過（服務器未運行）");
        return;
      }
      throw error;
    }
  });
});

// 運行測試
run().catch((error) => {
  console.error("❌ 測試運行失敗:", error);
  process.exit(1);
});
