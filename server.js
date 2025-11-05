/**
 * Lingya Voice Agent
 * Step ①：接入 OpenAI LLM
 * Step ②-B：升級為 Cartesia 聲線覺醒版 🎙️
 * 讓花小軟講話更自然、可持續串流播放
 */

import express from "express";
import expressWs from "express-ws";
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
import { VoiceWebSocketServer } from "./modules/websocket-voice.js";

dotenv.config();

const app = express();
// 啟用 WebSocket 支持
try {
  expressWs(app);
  console.log("✅ express-ws 已啟用");
} catch (error) {
  console.error("❌ express-ws 初始化失敗:", error);
  console.warn("⚠️  WebSocket 功能將不可用");
  // 不阻止應用啟動，允許 HTTP API 繼續工作
}
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

// OpenAI LLM 對話端點（支持歸屬記憶核心 + Prompt Routing）
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

    // 🎯 Step 1: Prompt Routing 檢查（優先於 LLM）
    let routingResult = null;
    let finalReply = null;
    let finalTags = [];
    let routingType = "normal";
    
    try {
      const { processPromptRouting } = await import("./modules/prompt-routing.js");
      
      // 嘗試路由（如果匹配，會使用 responsePool 中的回應）
      routingResult = await processPromptRouting(text, async (poolResponse, routing) => {
        // 直接返回 poolResponse，保持黃蓉的原始語氣
        return poolResponse;
      });
      
      if (routingResult && routingResult.success) {
        console.log(`🎯 使用 Prompt Routing 回應（${routingResult.persona}）`);
        finalReply = routingResult.response;
        finalTags = routingResult.voiceConfig?.tags || [];
        routingType = routingResult.routingType;
      }
    } catch (routingError) {
      console.warn("⚠️ Prompt Routing 處理失敗，使用正常 LLM 流程:", routingError);
    }

    // Step 2: 如果沒有路由匹配，使用正常 LLM 流程
    if (!finalReply) {
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
      
      finalReply = llmResult.reply;
      finalTags = llmResult.tags || [];
      routingType = "normal";
    }

    // 更新對話歷史
    const updatedHistory = [
      ...history,
      { role: "user", content: text },
      { role: "assistant", content: finalReply },
    ];

    // 獲取 toneTag 信息
    const { getToneTag } = await import("./modules/tts-cartesia.js");
    const toneTag = getToneTag(finalTags);

    res.json({
      reply: finalReply,
      tags: finalTags, // Step ③-B: 返回選擇的標籤
      emotion: routingType === "pool" ? null : emotion, // routing 時不使用 emotion
      history: updatedHistory,
      toneTag: toneTag, // 🎭 語氣圖案標籤
      routingType: routingType, // 標記路由類型（用於調試）
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
      
      // 優先使用快速關鍵詞推理（emotion-tags.js）
      // 如果失敗，再使用 LLM 進行更精確的推理
      try {
        const { inferEmotionTags } = await import("./modules/emotion-tags.js");
        const inferredTags = inferEmotionTags(text, {
          userIdentity: detectedIdentity,
        });
        
        if (inferredTags && inferredTags.length > 0) {
          finalTags = inferredTags;
          console.log(`✅ 關鍵詞推理標籤: [${finalTags.join(", ")}]`);
        } else {
          // 如果關鍵詞推理沒有結果，使用 LLM 進行更精確的推理
          const { chatWithLLM } = await import("./modules/llm.js");
          const llmResult = await chatWithLLM(
            `請為以下文字選擇 0-3 個適合的語氣標籤（只需選擇標籤，不需要生成回復）：\n\n"${text}"`,
            [],
            {
              enableTags: true,
              userIdentity: detectedIdentity,
              userName: userName,
            }
          );
          
          if (llmResult.tags && llmResult.tags.length > 0) {
            finalTags = llmResult.tags;
            console.log(`✅ LLM 自動選擇標籤: [${finalTags.join(", ")}]`);
          } else {
            console.log("💡 未選擇標籤，使用默認");
          }
        }
      } catch (error) {
        console.error("❌ 語氣推理失敗:", error);
        console.log("💡 使用默認標籤");
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

    // 獲取 toneTag 信息
    const { getToneTag } = await import("./modules/tts-cartesia.js");
    const toneTag = getToneTag(finalTags);

    // 設置 toneTag 相關 Header（供前端使用）
    // 將 emoji 和 label 編碼為 Base64，避免 HTTP header 錯誤（中文字符和 emoji 都會導致問題）
    // 使用 UTF-8 編碼確保 emoji 和中文正確處理
    const emojiBytes = Buffer.from(toneTag.emoji, 'utf-8');
    const emojiBase64 = emojiBytes.toString('base64');
    const labelBytes = Buffer.from(toneTag.label, 'utf-8');
    const labelBase64 = labelBytes.toString('base64');
    res.setHeader("X-Tone-Tag-Emoji", emojiBase64); // 語氣圖標（Base64 編碼）
    res.setHeader("X-Tone-Tag-Label", labelBase64); // 語氣標籤（Base64 編碼）
    res.setHeader("X-Tags", finalTags.join(","));

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
    let audioBuffer;
    let finalTags = tags || [];
    
    // 如果沒有標籤但有 emotion，轉換為標籤
    if (finalTags.length === 0 && emotion) {
      const emotionToTag = {
        '開心': ['excited', 'smile'],
        '難過': ['softer', 'breathy'],
        '生氣': ['angry', 'louder'],
        '平靜': ['neutral'],
      };
      if (emotionToTag[emotion]) {
        finalTags = emotionToTag[emotion];
      }
    }
    
    try {
      audioBuffer = await synthesizeSpeechCartesiaToBuffer(text, {
        tags: finalTags, // 優先使用標籤
        emotion, // 向後兼容
        tone,
      });
    } catch (ttsError) {
      console.error("❌ TTS 生成失敗:", ttsError);
      console.error("   錯誤類型:", ttsError.constructor.name);
      console.error("   錯誤堆疊:", ttsError.stack);
      
      // 返回詳細錯誤信息以便調試
      const errorMessage = ttsError.message || "TTS failed";
      const isEnvError = errorMessage.includes("environment variable");
      
      // 構建詳細的錯誤響應
      const errorResponse = {
        error: errorMessage,
        hint: isEnvError ? "請檢查 Railway 環境變數設置" : "TTS API 調用失敗，請檢查 Cartesia API Key 和 Voice ID",
      };
      
      // 如果是開發環境，添加更多調試信息
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.details = {
          type: ttsError.constructor.name,
          stack: ttsError.stack,
        };
      }
      
      return res.status(500).json(errorResponse);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(500).json({ error: "TTS returned empty audio buffer" });
    }

    // 獲取 toneTag 信息（如果失敗，使用默認值）
    let toneTag = { emoji: "🌸", label: "平靜" }; // 默認值
    try {
      const { getToneTag } = await import("./modules/tts-cartesia.js");
      toneTag = getToneTag(finalTags);
    } catch (toneTagError) {
      console.warn("⚠️ 獲取 toneTag 失敗，使用默認值:", toneTagError.message);
    }

    // 設置正確的 Content-Type（WAV 格式）
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("X-Tags", finalTags.join(",")); // 方便前端知道使用了哪些標籤
    // 將 emoji 和 label 編碼為 Base64，避免 HTTP header 錯誤（中文字符和 emoji 都會導致問題）
    // 使用 UTF-8 編碼確保 emoji 和中文正確處理
    const emojiBytes = Buffer.from(toneTag.emoji, 'utf-8');
    const emojiBase64 = emojiBytes.toString('base64');
    const labelBytes = Buffer.from(toneTag.label, 'utf-8');
    const labelBase64 = labelBytes.toString('base64');
    res.setHeader("X-Tone-Tag-Emoji", emojiBase64); // 語氣圖標（Base64 編碼）
    res.setHeader("X-Tone-Tag-Label", labelBase64); // 語氣標籤（Base64 編碼）
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
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 管理後台登入嘗試: username=${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "請輸入帳號和密碼" });
    }
    
    if (username === "admin" && password === "admin") {
      const sessionId = Date.now().toString() + Math.random().toString(36);
      sessions.set(sessionId, { username, loginTime: Date.now() });
      
      // 設置 Cookie（生產環境需要 secure 和 sameSite）
      const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
      const cookieOptions = {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24小時
      };
      
      // 如果是生產環境（Railway），添加 secure 和 sameSite
      if (isProduction) {
        cookieOptions.secure = true; // 只在 HTTPS 下傳輸
        cookieOptions.sameSite = 'none'; // 允許跨域
      }
      
      res.cookie("admin_session", sessionId, cookieOptions);
      
      console.log(`✅ 管理後台登入成功: sessionId=${sessionId.substring(0, 10)}...`);
      res.json({ success: true, message: "登入成功" });
    } else {
      console.log(`❌ 管理後台登入失敗: 帳號或密碼錯誤`);
      res.status(401).json({ success: false, error: "帳號或密碼錯誤" });
    }
  } catch (error) {
    console.error("❌ 登入處理錯誤:", error);
    res.status(500).json({ success: false, error: "登入時發生錯誤：" + error.message });
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

    // 獲取 toneTag 信息
    const { getToneTag } = await import("./modules/tts-cartesia.js");
    const toneTag = getToneTag(tags);

    // 設置正確的 Content-Type（WAV 格式）
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("X-Tags", tags.join(",")); // 方便前端知道使用了哪些標籤
    // 將 emoji 和 label 編碼為 Base64，避免 HTTP header 錯誤（中文字符和 emoji 都會導致問題）
    // 使用 UTF-8 編碼確保 emoji 和中文正確處理
    const emojiBytes = Buffer.from(toneTag.emoji, 'utf-8');
    const emojiBase64 = emojiBytes.toString('base64');
    const labelBytes = Buffer.from(toneTag.label, 'utf-8');
    const labelBase64 = labelBytes.toString('base64');
    res.setHeader("X-Tone-Tag-Emoji", emojiBase64); // 語氣圖標（Base64 編碼）
    res.setHeader("X-Tone-Tag-Label", labelBase64); // 語氣標籤（Base64 編碼）
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

// 初始化 WebSocket 語音服務器（使用 try-catch 包裹，避免啟動失敗）
let wsServer = null;
try {
  wsServer = new VoiceWebSocketServer(app);
  console.log("✅ WebSocket 語音服務器初始化成功");
} catch (wsError) {
  console.error("❌ WebSocket 服務器初始化失敗:", wsError);
  console.warn("⚠️  應用將繼續運行，但 WebSocket 功能不可用");
  // 不阻止應用啟動，允許 HTTP API 繼續工作
}

// 添加全局錯誤處理
process.on("uncaughtException", (error) => {
  console.error("❌ 未捕獲的異常:", error);
  console.error("   堆疊:", error.stack);
  // 不退出進程，記錄錯誤即可（Railway 會自動重啟）
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ 未處理的 Promise 拒絕:", reason);
  console.error("   發生在:", promise);
  if (reason && reason.stack) {
    console.error("   堆疊:", reason.stack);
  }
});

const PORT = process.env.PORT || 3000;

// 啟動服務器（添加錯誤處理）
try {
  app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`   🌐 ChatKit 界面: http://localhost:${PORT}`);
    console.log(`   🔐 管理後台: http://localhost:${PORT}/admin (帳號/密碼: admin/admin)`);
    console.log(`   📝 文字對話: POST http://localhost:${PORT}/api/chat`);
    console.log(`   🎙️  語音對話: POST http://localhost:${PORT}/api/voice-chat`);
    if (wsServer) {
      console.log(`   🔌 WebSocket 語音: ws://localhost:${PORT}/api/voice-ws (實時串流) 🆕`);
    } else {
      console.log(`   ⚠️  WebSocket 語音: 不可用（使用 HTTP API）`);
    }
    console.log(`   🔊 語音合成: POST http://localhost:${PORT}/api/speak (Cartesia，支持自動推理標籤) 🎙️`);
    console.log(`   🎧 語氣預覽: POST http://localhost:${PORT}/api/preview (快速試聽語氣組合)`);
    console.log(`   🔮 聲音快取: GET http://localhost:${PORT}/api/preset/:name?text=... (預設語氣)`);
    console.log(`   🎤 語音識別: POST http://localhost:${PORT}/api/transcribe\n`);
  });
} catch (startError) {
  console.error("❌ 服務器啟動失敗:", startError);
  console.error("   堆疊:", startError.stack);
  process.exit(1);
}
