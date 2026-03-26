import Tesseract from "tesseract.js";

class OcrService {
  /**
   * Extracts text from an image file using Tesseract.js (Browser).
   * @param {File | Blob | string} imageSource - The image file object or URL.
   * @returns {Promise<string>} The extracted text.
   */
  async extractText(imageSource) {
    try {
      console.log("OCR Service: Starting Tesseract (Browser)...");

      // Convert raw File/Blob to Base64 to avoid WebView filesystem issues
      let processedImage = imageSource;
      if (imageSource instanceof File || imageSource instanceof Blob) {
        console.log("OCR Service: Converting File/Blob to Data URL...");
        processedImage = await this.fileToDataUrl(imageSource);
      }

      const result = await Tesseract.recognize(processedImage, "eng", {
        logger: (m) =>
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`),
      });

      const text = result.data.text;
      console.log(
        "OCR Service: Text extracted.",
        text.substring(0, 50) + "...",
      );
      return text;
    } catch (error) {
      console.error("OCR Service Error:", error);
      throw new Error(
        "Failed to read image. Please try a clearer photo or a different format.",
      );
    }
  }

  /**
   * Helper to safely convert File/Blob to Data URL (Base64)
   */
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Parses the raw OCR text to extract standardized soil parameters.
   * @param {string} text - Raw text from OCR.
   * @returns {Object} Extracted data { ph, nitrogen, phosphorus, potassium, organic_carbon }
   */
  parseSoilReport(text) {
    const cleanedText = text.toLowerCase().replace(/\s+/g, " ");

    const data = {
      // pH patterns - handle various formats
      ph: this.extractValue(cleanedText, [
        /ph\s*(?:\(1:2\.5\))?\s*:?\s*(\d+(?:\.\d+)?)/,
        /reaction\s*:?\s*(\d+(?:\.\d+)?)/,
      ]),

      // Nitrogen patterns - handle Indian formats with units
      nitrogen: this.extractValue(cleanedText, [
        /available\s+nitrogen\s*(?:\(as\s+n\))?\s*(\d+(?:\.\d+)?)/,
        /available\s+n\s*(?:\(as\s+n\))?\s*(\d+(?:\.\d+)?)/,
        /n\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /nitrogen\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /\bn\s*:?\s*(\d+(?:\.\d+)?)/,
      ]),

      // Phosphorus patterns - handle P₂O₅ and P2O5 formats
      phosphorus: this.extractValue(cleanedText, [
        /available\s+phosphorus\s*(?:\(as\s+p\))?\s*(\d+(?:\.\d+)?)/,
        /available\s+p\s*(?:\(as\s+p\))?\s*(\d+(?:\.\d+)?)/,
        /p[₂2]?o[₅5]\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /p2o5\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /phosphorus\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /\bp\s*:?\s*(\d+(?:\.\d+)?)/,
      ]),

      // Potassium patterns - handle K₂O and K2O formats
      potassium: this.extractValue(cleanedText, [
        /available\s+potassium\s*(?:\(as\s+k\))?\s*(\d+(?:\.\d+)?)/,
        /available\s+k\s*(?:\(as\s+k\))?\s*(\d+(?:\.\d+)?)/,
        /k[₂2]?o\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /k2o\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /potassium\s*(?:\(?\s*kg\s*\/?\s*ha\s*\)?)\s*:?\s*(\d+(?:\.\d+)?)/,
        /\bk\s*:?\s*(\d+(?:\.\d+)?)/,
      ]),

      // Organic Carbon patterns - handle OC and percentage formats
      organic_carbon: this.extractValue(cleanedText, [
        /organic\s+carbon\s*(\d+(?:\.\d+)?)/,
        /oc\s*(?:\(%\))?\s*:?\s*(\d+(?:\.\d+)?)/,
        /organic\s+carbon\s*(?:\(%\))?\s*:?\s*(\d+(?:\.\d+)?)/,
      ]),
    };

    console.log("Parsed Soil Data:", data);

    // Post-processing sanity check (basic)
    if (!data.ph) data.ph = 7.0; // Default Neutral if missing
    if (!data.organic_carbon) data.organic_carbon = 0.5;

    return data;
  }

  extractValue(text, regexPatterns) {
    for (const pattern of regexPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
    }
    return null;
  }
}

export default new OcrService();
