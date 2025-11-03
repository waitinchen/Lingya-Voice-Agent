/**
 * Lingya Voice Agent
 * Step ①：接入 OpenAI LLM
 * Step ②-B：升級為 Cartesia 聲線覺醒版 🎙️
 * 讓花小軟講話更自然、可持續串流播放
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import cookieParser from "cookie-parser";
import { chatWithLLM, getSystemPrompt, updateSystemPrompt } from "./modules/llm.js";
import { synthesizeSpeechCartesia, synthesizeSpeechCartesiaToBuffer } from "./modules/tts-cartesia.js";
import { processVoiceConversation } from "./modules/voiceConversation.js";
import { transcribeFromBase64 } from "./modules/stt.js";
// 保留 OpenAI TTS 以便切換
import { synthesizeSpeech, synthesizeSpeechToBuffer } from "./modules/tts.js";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json({ limit: "50mb" })); // 支援大檔案
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 設定 multer 處理文件上傳（保留原始文件名和擴展名）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 保留原始文件名和擴展名，確保 Whisper API 能識別格式
    const originalName = file.originalname || "recording";
    const ext = path.extname(originalName) || ".webm"; // 默認 webm
    const baseName = path.basename(originalName, ext) || "recording";
    const timestamp = Date.now();
    cb(null, `${baseName}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    // 檢查文件類型，確保是音頻格式
    const allowedMimes = [
      "audio/webm",
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/flac",
    ];
    
    if (allowedMimes.includes(file.mimetype) || !file.mimetype) {
      // 允許未知 MIME 類型（某些瀏覽器可能不發送）
      cb(null, true);
    } else {
      cb(new Error(`不支持的音頻格式: ${file.mimetype}`), false);
    }
  },
});

// 靜態文件服務（用於 ChatKit 界面）
app.use(express.static("public"));

// 根據環境變數決定使用哪個 TTS 提供商
const TTS_PROVIDER = process.env.TTS_PROVIDER || "cartesia"; // 預設使用 Cartesia

// 根路由 - 返回聊天界面（如果靜態文件服務沒匹配到）
app.get("/", (_, res) => {
  const indexPath = path.join(process.cwd(), "public", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("Lingya Voice Agent is running 💫 (Cartesia Voice)");
  }
});

// OpenAI LLM 對話端點（支持歸屬記憶核心）
app.post("/api/chat", async (req, res) => {
  try {
    const { text, history = [], emotion, userName, userIdentity } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text input" });
    }

    // 檢測用戶身份（歸屬記憶核心）
    // 優先使用明確的 userIdentity，其次根據 userName 判斷
    let detectedIdentity = userIdentity;
    if (!detectedIdentity && userName) {
      if (userName === "陳威廷" || userName === "陈威廷" || userName.toLowerCase().includes("威廷")) {
        detectedIdentity = "dad";
      }
    }

    // 分析情緒（如果沒有提供）
    let detectedEmotion = emotion;
    if (!detectedEmotion) {
      const { analyzeEmotion } = await import("./modules/llm.js");
      detectedEmotion = await analyzeEmotion(text);
    }

    // 使用對話歷史和情緒生成回應（支持標籤選擇和身份識別）
    const llmResult = await chatWithLLM(text, history, {
      emotion: detectedEmotion,
      isVoice: false,
      enableTags: true, // 啟用標籤選擇
      userIdentity: detectedIdentity, // 傳遞用戶身份
      userName: userName, // 傳遞用戶名稱
    });

    // 更新對話歷史
    const updatedHistory = [
      ...history,
      { role: "user", content: text },
      { role: "assistant", content: llmResult.reply },
    ];

    res.json({
      reply: llmResult.reply,
      tags: llmResult.tags || [], // Step ③-B: 返回選擇的標籤
      emotion: detectedEmotion,
      history: updatedHistory,
    });
  } catch (error) {
    console.error("❌ 處理請求失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// Step ②-B: 語音合成端點（使用 Cartesia，支持情緒標籤）
// 升級版：整合 LLM 自動推理語氣標籤（語氣隨思）
app.post("/api/speak", async (req, res) => {
  try {
    const { text, tags = [], emotion, autoTags = true, userIdentity, userName } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text input" });
    }

    let finalTags = [...tags];
    
    // ========================================
    // 🩵 自動推理語氣標籤（如果啟用）
    // ========================================
    if (autoTags && tags.length === 0 && !emotion) {
      console.log("🧠 自動推理語氣標籤...");
      
      // 檢測用戶身份
      let detectedIdentity = userIdentity;
      if (!detectedIdentity && userName) {
        if (userName === "陳威廷" || userName === "陈威廷" || userName.toLowerCase().includes("威廷")) {
          detectedIdentity = "dad";
        }
      }
      
      // 使用 LLM 選擇語氣標籤（不生成完整回復，只選擇標籤）
      const { chatWithLLM } = await import("./modules/llm.js");
      const llmResult = await chatWithLLM(
        `請為以下文字選擇 0-3 個適合的語氣標籤（只需選擇標籤，不需要生成回復）：\n\n"${text}"`,
        [],
        {
          enableTags: true,
          userIdentity: detectedIdentity,
          userName: userName,
          skipReply: false, // 仍然需要生成回復，但會提取標籤
        }
      );
      
      if (llmResult.tags && llmResult.tags.length > 0) {
        finalTags = llmResult.tags;
        console.log(`✅ LLM 自動選擇標籤: [${finalTags.join(", ")}]`);
      } else {
        console.log("💡 LLM 未選擇標籤，使用默認");
      }
    }

    // 使用 Cartesia TTS 生成語音檔案（支持標籤）
    const filePath = await synthesizeSpeechCartesia(text, null, {
      tags: finalTags,
      emotion,
    });

    if (!filePath) {
      return res.status(500).json({ error: "TTS failed" });
    }

    // 返回音檔（WAV 格式）
    res.sendFile(filePath, { root: process.cwd() }, (err) => {
      if (err) {
        console.error("❌ 發送檔案失敗:", err);
        res.status(500).json({ error: "Failed to send audio file" });
      }
    });
  } catch (error) {
    console.error("❌ TTS 處理失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// 語音合成端點（返回 Buffer，直接傳輸）- Cartesia 版本（支持情緒標籤）
app.post("/api/speak-stream", async (req, res) => {
  try {
    const { text, tags = [], emotion, tone } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text input" });
    }

    // Step ③-B 增強：支持情緒標籤控制語音語氣
    const audioBuffer = await synthesizeSpeechCartesiaToBuffer(text, {
      tags, // 優先使用標籤
      emotion, // 向後兼容
      tone,
    });

    if (!audioBuffer) {
      return res.status(500).json({ error: "TTS failed" });
    }

    // 設置正確的 Content-Type（WAV 格式）
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);
    res.send(audioBuffer);
  } catch (error) {
    console.error("❌ TTS 處理失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// Step ③-A: 完整語音對話端點（音頻輸入 → 音頻輸出，支持歸屬記憶）
app.post("/api/voice-chat", upload.single("audio"), async (req, res) => {
  try {
    let audioInput;
    let language = req.body.language || "zh";
    const { userName, userIdentity } = req.body;

    console.log("🎤 收到語音請求");
    console.log(`   文件: ${req.file ? req.file.originalname : '無'}`);
    console.log(`   大小: ${req.file ? (req.file.size / 1024).toFixed(2) + ' KB' : '未知'}`);

    // 處理音頻輸入（文件或 Base64）
    if (req.file) {
      // 文件上傳
      audioInput = req.file.path;
      console.log(`📂 使用上傳文件: ${audioInput}`);
      
      // 確保文件存在
      if (!fs.existsSync(audioInput)) {
        return res.status(400).json({ error: "上傳的音頻文件不存在" });
      }
    } else if (req.body.audio) {
      // Base64 字串
      audioInput = req.body.audio;
      console.log("📦 使用 Base64 音頻數據");
    } else {
      console.error("❌ 缺少音頻輸入");
      return res.status(400).json({ error: "Missing audio input" });
    }

    const history = req.body.history ? JSON.parse(req.body.history) : [];

    // 檢測用戶身份
    let detectedIdentity = userIdentity;
    if (!detectedIdentity && userName) {
      if (userName === "陳威廷" || userName === "陈威廷" || userName.toLowerCase().includes("威廷")) {
        detectedIdentity = "dad";
      }
    }

    // 處理完整語音對話流程（傳遞身份信息）
    const result = await processVoiceConversation(audioInput, {
      language,
      history,
      returnAudio: true,
      userIdentity: detectedIdentity,
      userName: userName,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      text: result.text,
      transcribedText: result.transcribedText,
      audio: result.audio, // Base64 編碼的音頻
      history: result.history,
      emotion: result.emotion, // Step ③-B: 返回檢測到的情緒
      tags: result.tags || [], // Step ③-B: 返回選擇的標籤
    });
  } catch (error) {
    console.error("❌ 語音對話處理失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// Step ③-A: 語音識別端點（僅 STT）
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    let audioInput;
    const language = req.body.language || "zh";

    if (req.file) {
      // 文件上傳，直接使用路徑
      const { transcribeAudio } = await import("./modules/stt.js");
      const text = await transcribeAudio(req.file.path, { language });
      res.json({ success: true, text });
      // 清理臨時文件
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } else if (req.body.audio) {
      // Base64 字串
      const text = await transcribeFromBase64(req.body.audio, { language });
      res.json({ success: true, text });
    } else {
      return res.status(400).json({ error: "Missing audio input" });
    }
  } catch (error) {
    console.error("❌ 語音識別失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 管理後台 API
// ========================================

// 簡單的認證中間件（使用 session 存儲在內存）
const sessions = new Map();

function requireAuth(req, res, next) {
  const sessionId = req.cookies?.admin_session;
  
  if (sessionId && sessions.has(sessionId)) {
    req.session = sessions.get(sessionId);
    next();
  } else {
    res.status(401).json({ success: false, error: "未授權，請先登入" });
  }
}

// 登入端點
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  
  if (username === "admin" && password === "admin") {
    const sessionId = Date.now().toString() + Math.random().toString(36);
    sessions.set(sessionId, { username, loginTime: Date.now() });
    
    res.cookie("admin_session", sessionId, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24小時
    });
    
    res.json({ success: true, message: "登入成功" });
  } else {
    res.status(401).json({ success: false, error: "帳號或密碼錯誤" });
  }
});

// 檢查認證狀態
app.get("/api/admin/check-auth", (req, res) => {
  const sessionId = req.cookies?.admin_session;
  
  if (sessionId && sessions.has(sessionId)) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// 登出端點
app.post("/api/admin/logout", (req, res) => {
  const sessionId = req.cookies?.admin_session;
  
  if (sessionId) {
    sessions.delete(sessionId);
    res.clearCookie("admin_session");
  }
  
  res.json({ success: true, message: "已登出" });
});

// 獲取系統提示詞
app.get("/api/admin/get-prompt", requireAuth, async (req, res) => {
  try {
    const prompt = await getSystemPrompt();
    res.json({ success: true, prompt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新系統提示詞
app.post("/api/admin/update-prompt", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "提示詞不能為空" });
    }
    
    await updateSystemPrompt(prompt);
    res.json({ success: true, message: "提示詞已更新" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 管理後台頁面
app.get("/admin", (req, res) => {
  const adminPath = path.join(process.cwd(), "public", "admin.html");
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send("管理後台頁面不存在");
  }
});

// ========================================
// 🎧 即時語氣預覽端點
// ========================================
app.post("/api/preview", async (req, res) => {
  try {
    const { text, tags = [] } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text input" });
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({ error: "Missing tags. Please provide at least one tag." });
    }

    console.log(`🎧 語氣預覽: "${text}" [${tags.join(", ")}]`);

    // 使用 Cartesia TTS 生成語音 Buffer
    const audioBuffer = await synthesizeSpeechCartesiaToBuffer(text, {
      tags,
    });

    if (!audioBuffer) {
      return res.status(500).json({ error: "TTS failed" });
    }

    // 設置正確的 Content-Type（WAV 格式）
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("X-Tags", tags.join(",")); // 方便前端知道使用了哪些標籤
    res.send(audioBuffer);
  } catch (error) {
    console.error("❌ 語氣預覽失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 🔮 Cartesia 聲音快取（Voice Preset Profile）
// ========================================
app.get("/api/preset/:presetName", async (req, res) => {
  try {
    const { presetName } = req.params;
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({ error: "Missing text parameter. Use: /api/preset/:presetName?text=..." });
    }

    // 載入預設配置
    const presetsPath = path.join(process.cwd(), "config", "voice-presets.json");
    let presets;
    
    try {
      presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
    } catch (error) {
      console.error("❌ 無法載入 voice-presets.json");
      return res.status(500).json({ error: "Voice presets not available" });
    }

    const preset = presets[presetName.toLowerCase()];

    if (!preset) {
      const availablePresets = Object.keys(presets).join(", ");
      return res.status(404).json({ 
        error: `Preset '${presetName}' not found. Available presets: ${availablePresets}` 
      });
    }

    console.log(`🔮 使用預設語氣 "${preset.name}": "${text}" [${preset.tags.join(", ")}]`);

    // 使用預設標籤生成語音
    const audioBuffer = await synthesizeSpeechCartesiaToBuffer(text, {
      tags: preset.tags,
    });

    if (!audioBuffer) {
      return res.status(500).json({ error: "TTS failed" });
    }

    // 設置正確的 Content-Type（WAV 格式）
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("X-Preset-Name", preset.name);
    res.setHeader("X-Preset-Description", preset.description);
    res.setHeader("X-Preset-Tags", preset.tags.join(","));
    res.send(audioBuffer);
  } catch (error) {
    console.error("❌ 預設語氣失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取所有可用的預設
app.get("/api/preset", async (req, res) => {
  try {
    const presetsPath = path.join(process.cwd(), "config", "voice-presets.json");
    let presets;
    
    try {
      presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
    } catch (error) {
      console.error("❌ 無法載入 voice-presets.json");
      return res.status(500).json({ error: "Voice presets not available" });
    }

    // 格式化預設列表（只返回基本信息）
    const presetList = Object.keys(presets).map(key => ({
      id: key,
      name: presets[key].name,
      description: presets[key].description,
      tags: presets[key].tags,
    }));

    res.json({
      success: true,
      presets: presetList,
    });
  } catch (error) {
    console.error("❌ 獲取預設列表失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

// OpenAI TTS 端點（保留以便切換）- 可選
app.post("/api/speak-openai", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text input" });
    }

    const filePath = await synthesizeSpeech(text);

    if (!filePath) {
      return res.status(500).json({ error: "TTS failed" });
    }

    res.sendFile(filePath, { root: process.cwd() }, (err) => {
      if (err) {
        console.error("❌ 發送檔案失敗:", err);
        res.status(500).json({ error: "Failed to send audio file" });
      }
    });
  } catch (error) {
    console.error("❌ TTS 處理失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`   🌐 ChatKit 界面: http://localhost:${PORT}`);
  console.log(`   🔐 管理後台: http://localhost:${PORT}/admin (帳號/密碼: admin/admin)`);
  console.log(`   📝 文字對話: POST http://localhost:${PORT}/api/chat`);
  console.log(`   🎙️  語音對話: POST http://localhost:${PORT}/api/voice-chat`);
  console.log(`   🔊 語音合成: POST http://localhost:${PORT}/api/speak (Cartesia，支持自動推理標籤) 🎙️`);
  console.log(`   🎧 語氣預覽: POST http://localhost:${PORT}/api/preview (快速試聽語氣組合)`);
  console.log(`   🔮 聲音快取: GET http://localhost:${PORT}/api/preset/:name?text=... (預設語氣)`);
  console.log(`   🎤 語音識別: POST http://localhost:${PORT}/api/transcribe\n`);
});
