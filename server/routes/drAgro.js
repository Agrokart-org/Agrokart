const express = require("express");
const router = express.Router();
const path = require("path");
const drAgroController = require("../controllers/drAgroController");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

// Route-Specific Rate Limiter for Dr. Agro AI/OCR endpoints
const drAgroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests to Dr. Agro service, please try again later."
  }
});

// File filter for soil test report uploads
const soilReportFileFilter = (req, file, cb) => {
  if (!file || !file.originalname) {
    return cb(new Error("Invalid file upload"), false);
  }

  // Prevent Path Traversal
  const baseName = path.basename(file.originalname);
  if (baseName.includes("..") || baseName.includes("\0")) {
    return cb(new Error("Malicious filename detected"), false);
  }

  // File extension check
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
  const ext = path.extname(baseName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Unsupported file format. Only JPG, PNG, WEBP, GIF, and PDF files are supported."), false);
  }

  // Mime type check
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];
  if (file.mimetype && !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    return cb(new Error("Invalid file MIME type."), false);
  }

  cb(null, true);
};

// Configure Multer with Memory Storage & Security Constraints
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: soilReportFileFilter,
});

/**
 * @route   POST /api/dr-agro/analyze-report
 * @desc    Analyze uploaded soil test report
 * @access  Public
 */
router.post(
  "/analyze-report",
  drAgroLimiter,
  (req, res, next) => {
    upload.single("report")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer Error:", err);
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        console.error("File Validation Error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "File upload failed" });
      }
      next();
    });
  },
  drAgroController.analyzeReport
);

/**
 * @route   POST /api/dr-agro/analyze-manual
 * @desc    Analyze manually entered soil data
 * @access  Public
 */
router.post("/analyze-manual", drAgroLimiter, drAgroController.analyzeManual);

/**
 * @route   POST /api/dr-agro/chat
 * @desc    Conversational RAG Chatbot Endpoint
 * @access  Public
 */
router.post("/chat", drAgroLimiter, drAgroController.chatWithRAG);

/**
 * @route   GET /api/dr-agro/health
 * @desc    Proxy RAG Health Check
 * @access  Public
 */
router.get("/health", drAgroController.checkRAGHealth);

/**
 * @route   DELETE /api/dr-agro/session/:sessionId
 * @desc    Proxy RAG Session Clear
 * @access  Public
 */
router.delete("/session/:sessionId", drAgroController.clearRAGSession);

module.exports = router;

