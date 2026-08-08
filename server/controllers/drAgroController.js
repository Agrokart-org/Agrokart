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
    const { crop, language } = req.body;
    let imageBuffer;
    if (req.file.buffer) {
      imageBuffer = req.file.buffer;
    } else if (req.file.path) {
      imageBuffer = fs.readFileSync(req.file.path);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    const result = await recommendationEngine.processReport(imageBuffer, crop || "wheat", language || "en");
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

/**
 * RAG Chatbot — proxies to Python RAG service with session support
 */
exports.chatWithRAG = async (req, res) => {
  try {
    const { message, ml_recommendation, session_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
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
