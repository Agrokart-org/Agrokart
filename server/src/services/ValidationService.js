/**
 * Validation Service
 * strict checks to reject non-soil images.
 */
class ValidationService {
  constructor() {
    this.REQUIRED_KEYWORDS = [
      "soil",
      "test",
      "report",
      "agriculture",
      "farmer",
      "sample",
      "lab",
      "ph",
      "nitrogen",
      "phosphorus",
      "potassium",
      "carbon",
      "ec",
    ];

    // At least 3 keywords must be present to consider it potentially valid
    this.KEYWORD_THRESHOLD = 3;
  }

  /**
   * Validates if the text represents a valid Soil Test Report
   * @param {string} text Extracted OCR text
   * @returns {Object} { isValid: boolean, confidence: number, message: string }
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
    let keywordCount = 0;

    this.REQUIRED_KEYWORDS.forEach((word) => {
      if (lowerText.includes(word)) {
        keywordCount++;
      }
    });

    const confidence = Math.min(
      (keywordCount / this.KEYWORD_THRESHOLD) * 100,
      100,
    );

    // Strict Check: Must have pH and N/P/K mentions to be useful
    const hasNutrients =
      lowerText.includes("ph") &&
      (lowerText.includes("nitrogen") ||
        lowerText.includes("n") ||
        lowerText.includes("phosphorus") ||
        lowerText.includes("p"));

    if (keywordCount >= this.KEYWORD_THRESHOLD && hasNutrients) {
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

  /**
   * Validates extracted numeric data ranges
   * @param {Object} data { ph, nitrogen, ... }
   * @returns {boolean} True if data looks realistic
   */
  validateDataRanges(data) {
    if (!data) return false;

    // pH: 0-14
    if (data.ph && (data.ph < 0 || data.ph > 14)) return false;

    // Nitrogen: 0-1000 kg/ha (Rare to be higher)
    if (data.nitrogen && (data.nitrogen < 0 || data.nitrogen > 2000))
      return false;

    return true;
  }
}

module.exports = new ValidationService();
