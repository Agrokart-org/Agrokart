const recommendationEngine = require("../services/RecommendationEngine");
const fs = require("fs");

/**
 * Controller for Dr. Agro (Offline AI)
 */
exports.analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const { crop, language } = req.body;

    let imageBuffer;
    if (req.file.buffer) {
      imageBuffer = req.file.buffer;
    } else if (req.file.path) {
      imageBuffer = fs.readFileSync(req.file.path);
      // Cleanup uploaded file only if it was on disk
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    // Process via Engine
    const result = await recommendationEngine.processReport(
      imageBuffer,
      crop || "wheat",
      language || "en",
    );

    if (!result.success) {
      return res.status(200).json(result); // Return as structured error for UI
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Dr.Agro Controller Error:", error);
    // Ensure cleanup if path existed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    res
      .status(500)
      .json({ success: false, message: "Internal Analysis Error" });
  }
};

exports.analyzeManual = async (req, res) => {
  try {
    // Expecting { ph, nitrogen, phosphorus, potassium, crop, language }
    const { crop, language, ...soilData } = req.body;

    const result = await recommendationEngine.processManualData(
      soilData,
      crop || "wheat",
      language || "en",
    );

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Dr.Agro Manual Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
