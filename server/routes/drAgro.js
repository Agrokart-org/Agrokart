const express = require("express");
const router = express.Router();
const drAgroController = require("../controllers/drAgroController");
const multer = require("multer");

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @route   POST /api/dr-agro/analyze-report
 * @desc    Analyze uploaded soil test report (Offline AI)
 * @access  Public
 */
router.post(
  "/analyze-report",
  (req, res, next) => {
    // Wrap upload to handle Multer errors gracefully
    upload.single("report")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer Limit Error:", err);
        return res
          .status(400)
          .json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        console.error("Unknown Upload Error:", err);
        return res
          .status(500)
          .json({ success: false, message: "File upload failed" });
      }
      next();
    });
  },
  drAgroController.analyzeReport,
);

/**
 * @route   POST /api/dr-agro/analyze-manual
 * @desc    Analyze manually entered soil data (Offline AI)
 * @access  Public
 */
router.post("/analyze-manual", drAgroController.analyzeManual);

/**
 * @route   POST /api/dr-agro/chat
 * @desc    Conversational RAG Chatbot Endpoint
 * @access  Public
 */
router.post("/chat", drAgroController.chatWithRAG);

module.exports = router;

