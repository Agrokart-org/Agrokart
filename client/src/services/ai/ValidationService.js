class ValidationService {
  constructor() {
    // Essential keywords for a valid soil report
    this.REQUIRED_KEYWORDS = [
      "ph",
      "nitrogen",
      "phosphorus",
      "potassium",
      "carbon",
      "ec",
      "electrical",
    ];
    this.KEYWORD_THRESHOLD = 3; // Must match at least 3
  }

  /**
   * Checks if the extracted text looks like a valid Soil Test Report.
   * @param {string} text - The raw text from OCR.
   * @returns {Object} result - { isValid, confidence, message }
   */
  isValidSoilReport(text) {
    if (!text || text.length < 50) {
      return {
        isValid: false,
        confidence: 0,
        message: "Image text is too short or unreadable.",
      };
    }

    const lowerText = text.toLowerCase();

    // 1. Keyword Density Check - Enhanced for agricultural reports
    let keywordCount = 0;
    this.REQUIRED_KEYWORDS.forEach((word) => {
      if (lowerText.includes(word)) keywordCount++;
    });

    // Additional agricultural-specific terms
    const agriculturalTerms = [
      "soil",
      "sample",
      "analysis",
      "available",
      "organic",
    ];
    let agriCount = 0;
    agriculturalTerms.forEach((term) => {
      if (lowerText.includes(term)) agriCount++;
    });

    // Reject construction/geotechnical reports explicitly
    const constructionTerms = [
      "liquid limit",
      "plastic limit",
      "proctor",
      "cbr",
      "swell index",
    ];
    let constructionCount = 0;
    constructionTerms.forEach((term) => {
      if (lowerText.includes(term)) constructionCount++;
    });

    if (constructionCount >= 2) {
      return {
        isValid: false,
        confidence: 0,
        message:
          "This appears to be a construction/geotechnical report, not an agricultural soil analysis.",
      };
    }

    const hasNutrients =
      lowerText.includes("n") ||
      lowerText.includes("p") ||
      lowerText.includes("k");

    // Confidence calculation based on keywords
    let confidence = ((keywordCount + agriCount) / 8) * 100; // More generous scoring
    if (confidence > 100) confidence = 100;

    // 2. Classify - More lenient for agricultural reports
    if (keywordCount >= 2 && agriCount >= 1 && hasNutrients) {
      return {
        isValid: true,
        confidence: Math.round(confidence),
        message: "Valid soil report detected.",
      };
    } else if (keywordCount >= this.KEYWORD_THRESHOLD) {
      return {
        isValid: true,
        confidence: Math.round(confidence),
        message: "Valid soil report detected.",
      };
    } else {
      return {
        isValid: false,
        confidence: Math.round(confidence),
        message:
          "This does not appear to be a valid soil test report. Missing key terms.",
      };
    }
  }
}

export default new ValidationService();
