const axios = require("axios");

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000";

/**
 * Controller for Dr. Agro — Soil Report Analysis
 */
exports.analyzeReport = async (req, res) => {
  try {
    const fs = require("fs");
    const recommendationEngine = require("../services/RecommendationEngine");

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    if (req.file.buffer && req.file.buffer.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded file is empty (0 bytes)." });
    }
    const { crop, language, region, season, soil_type, conditions } = req.body || {};
    let imageBuffer;
    if (req.file.buffer) {
      imageBuffer = req.file.buffer;
    } else if (req.file.path) {
      imageBuffer = fs.readFileSync(req.file.path);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    const contextData = { region, season, soil_type, conditions };
    const result = await recommendationEngine.processReport(imageBuffer, crop || "wheat", language || "en", contextData);
    if (!result.success) return res.status(200).json(result);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Dr.Agro Report Error:", error);
    res.status(500).json({ success: false, message: "Internal Analysis Error" });
  }
};

/**
 * Manual soil data analysis
 */
exports.analyzeManual = async (req, res) => {
  try {
    const recommendationEngine = require("../services/RecommendationEngine");
    const { crop, language, ...soilData } = req.body;
    const result = await recommendationEngine.processManualData(soilData, crop || "wheat", language || "en");
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Dr.Agro Manual Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

function classifyConversationalIntent(query) {
  if (!query || typeof query !== "string") return null;
  const cleanQ = query.trim().toLowerCase();
  const cleanText = cleanQ.replace(/[^\w\s]/g, "").trim();
  const normalized = cleanText.replace(/(.)\1{2,}/g, "$1");

  const greetings = new Set([
    "hi", "hii", "hiii", "hello", "helo", "hey", "heyy",
    "namaskar", "namaste", "namaskaar", "namasthe",
    "good morning", "good afternoon", "good evening", "good day", "goodnight", "good night",
    "suprabhat", "shubh prabhat", "greetings"
  ]);

  if (
    greetings.has(normalized) ||
    greetings.has(cleanText) ||
    /^(hi+|hello+|hey+|helo+|namaskar|namaste|good\s+(morning|afternoon|evening|day))\s*$/i.test(cleanText)
  ) {
    return {
      answer: "Hello! 👋 I’m Agro AI. I can help you with crop nutrition, fertilizers, soil health, irrigation, crop diseases, and other farming questions. What would you like to know?",
      sources: [],
      engine: "Conversational Assistant"
    };
  }

  const thanks = new Set([
    "thanks", "thank you", "thank u", "thx", "thankyou",
    "dhanyawad", "dhanyavaad", "many thanks", "thanks a lot", "thank you so much"
  ]);
  if (thanks.has(cleanText) || /^(thanks?|thank\s+you|thx|dhanyawad)\s*$/i.test(cleanText)) {
    return {
      answer: "You're welcome! 🌱 Let me know if you need help with your crop, soil, fertilizer, or farming practices.",
      sources: [],
      engine: "Conversational Assistant"
    };
  }

  const okSet = new Set(["ok", "okay", "kk", "got it", "k", "alright", "sure", "thik hai", "theek hai"]);
  if (okSet.has(cleanText) || /^(ok+|okay|got\s+it|thik\s+hai)\s*$/i.test(cleanText)) {
    return {
      answer: "Great! Let me know whenever you have any farming or crop questions. 🌾",
      sources: [],
      engine: "Conversational Assistant"
    };
  }

  const byeSet = new Set(["bye", "goodbye", "good bye", "see you", "take care", "tc", "alvida", "phir milenge"]);
  if (byeSet.has(cleanText) || /^(bye|good\s*bye|take\s+care|see\s+you)\s*$/i.test(cleanText)) {
    return {
      answer: "Goodbye, Kisan! 🌱 Wishing you a healthy and productive crop.",
      sources: [],
      engine: "Conversational Assistant"
    };
  }

  return null;
}

/**
 * RAG Chatbot — proxies to Python RAG service with session support
 */
exports.chatWithRAG = async (req, res) => {
  try {
    const { message, ml_recommendation, session_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const convIntent = classifyConversationalIntent(message);
    if (convIntent) {
      return res.json({
        success: true,
        answer: convIntent.answer,
        sources: [],
        engine: convIntent.engine,
        session_id: session_id || "conv-" + Date.now(),
      });
    }

    try {
      const response = await axios.post(`${RAG_SERVICE_URL}/chat`, {
        message: message.trim(),
        ml_recommendation: ml_recommendation || null,
        session_id: session_id || null,
      }, { timeout: 12000 });

      return res.json({
        success: true,
        answer: response.data.answer,
        sources: response.data.sources || [],
        engine: response.data.engine || "RAG Engine",
        session_id: response.data.session_id,
      });

    } catch (ragError) {
      console.error("⚠️ RAG Service error:", ragError.message);
      // Do NOT use keyword-based fallback — return honest error
      return res.status(503).json({
        success: false,
        message: "Sorry, I couldn't process that right now. The AI service may be starting up. Please try again in a moment.",
        error: "rag_service_unavailable",
      });
    }
  } catch (error) {
    console.error("Dr.Agro RAG Controller Error:", error);
    res.status(500).json({ success: false, message: "Server Error in RAG Chat" });
  }
};

/**
 * Debug — retrieval info (dev-only, should be protected in production)
 */
exports.debugRAG = async (req, res) => {
  try {
    const { message, session_id } = req.body;
    const response = await axios.post(`${RAG_SERVICE_URL}/debug/chat`, {
      message,
      session_id: session_id || null,
    }, { timeout: 15000 });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: "Debug endpoint error", detail: error.message });
  }
};

/**
 * Trigger document re-ingestion
 */
exports.ingestDocuments = async (req, res) => {
  try {
    const { doc_dir } = req.body;
    const response = await axios.post(`${RAG_SERVICE_URL}/ingest`, {
      doc_dir: doc_dir || "./data/agricultural_docs",
    }, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: "Ingestion trigger error" });
  }
};
