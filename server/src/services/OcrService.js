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
    const cleanedText = text.toLowerCase().replace(/\s+/g, " ");

    const data = {
      ph: this.extractValue(cleanedText, [
        /ph\s*:?\s*(\d+(\.\d+)?)/,
        /reaction\s*:?\s*(\d+(\.\d+)?)/,
      ]),
      nitrogen: this.extractValue(cleanedText, [
        /nitrogen\s*:?\s*(\d+)/,
        /n\s*:?\s*(\d+)/,
      ]),
      phosphorus: this.extractValue(cleanedText, [
        /phosphorus\s*:?\s*(\d+)/,
        /p\s*:?\s*(\d+)/,
      ]),
      potassium: this.extractValue(cleanedText, [
        /potassium\s*:?\s*(\d+)/,
        /k\s*:?\s*(\d+)/,
      ]),
      organic_carbon: this.extractValue(cleanedText, [
        /organic\s*carbon\s*:?\s*(\d+(\.\d+)?)/,
        /oc\s*:?\s*(\d+(\.\d+)?)/,
      ]),
    };

    // Post-processing: ensure values are numeric
    for (const key in data) {
      if (data[key]) {
        data[key] = parseFloat(data[key]);
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
