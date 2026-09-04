const tesseract = require("tesseract.js");
const fs = require("fs");

/**
 * Offline OCR Service using Tesseract.js
 * Strictly NO external APIs.
 */
class OcrService {
  /**
   * Extracts text from an image buffer using local Tesseract.js
   * @param {Buffer} imageBuffer
   * @returns {Promise<string>} Extracted text
   */
  async extractText(imageBuffer) {
    try {
      console.log("Starting Offline OCR...");
      const worker = await tesseract.createWorker("eng");

      // Optimize for agricultural text if possible (future enhancement)
      // await worker.setParameters({
      //   tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:.-% ',
      // });

      const {
        data: { text },
      } = await worker.recognize(imageBuffer);
      await worker.terminate();

      console.log("OCR Complete. Extracted Text Length:", text.length);
      return text;
    } catch (error) {
      console.error("OCR Error:", error);
      throw new Error("Failed to process image locally.");
    }
  }

  /**
   * Parses raw OCR text to extract soil parameters
   * Uses Regex patterns specific to Soil Health Cards
   * @param {string} text
   * @returns {Object} Extracted values { ph, nitrogen, phosphorus, potassium, organic_carbon }
   */
  parseSoilReport(text) {
    if (!text || typeof text !== "string") {
      return { ph: null, nitrogen: null, phosphorus: null, potassium: null, organic_carbon: null };
    }

    const cleanedText = text.toLowerCase().replace(/\s+/g, " ");

    const data = {
      ph: this.extractValue(cleanedText, [
        /ph\s*:?\s*(\d+(\.\d+)?)/,
        /soil\s*ph\s*:?\s*(\d+(\.\d+)?)/,
        /reaction\s*:?\s*(\d+(\.\d+)?)/,
      ]),
      nitrogen: this.extractValue(cleanedText, [
        /nitrogen\s*(?:\(n\))?\s*:?\s*(\d+(\.\d+)?)/,
        /available\s*nitrogen\s*:?\s*(\d+(\.\d+)?)/,
        /avail\s*n\s*:?\s*(\d+(\.\d+)?)/,
        /(?:^|\s)n\s*:?\s*(\d+(\.\d+)?)/,
      ]),
      phosphorus: this.extractValue(cleanedText, [
        /phosphorus\s*(?:\(p2o5\)?|\(p\))?\s*:?\s*(\d+(\.\d+)?)/,
        /available\s*phosphorus\s*:?\s*(\d+(\.\d+)?)/,
        /avail\s*p\s*:?\s*(\d+(\.\d+)?)/,
        /p2o5\s*:?\s*(\d+(\.\d+)?)/,
        /(?:^|\s)p\s*:?\s*(\d+(\.\d+)?)/,
      ]),
      potassium: this.extractValue(cleanedText, [
        /potassium\s*(?:\(k2o\)?|\(k\))?\s*:?\s*(\d+(\.\d+)?)/,
        /available\s*potassium\s*:?\s*(\d+(\.\d+)?)/,
        /avail\s*k\s*:?\s*(\d+(\.\d+)?)/,
        /k2o\s*:?\s*(\d+(\.\d+)?)/,
        /(?:^|\s)k\s*:?\s*(\d+(\.\d+)?)/,
      ]),
      organic_carbon: this.extractValue(cleanedText, [
        /organic\s*carbon\s*(?:\(oc\))?\s*:?\s*(\d+(\.\d+)?)/,
        /oc\s*:?\s*(\d+(\.\d+)?)/,
      ]),
    };

    // Post-processing: ensure values are numeric or null
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        const val = parseFloat(data[key]);
        data[key] = isNaN(val) ? null : val;
      } else {
        data[key] = null;
      }
    }

    return data;
  }

  extractValue(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null; // Value not found
  }
}

module.exports = new OcrService();
