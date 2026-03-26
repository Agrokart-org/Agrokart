const ocrService = require("./OcrService");
const validationService = require("./ValidationService");
const expertSystem = require("./ExpertSystem");
const qualityModel = require("./QualityModel");
const locales = {
  en: require("../data/knowledgeBase/locales/en.json"),
  hi: require("../data/knowledgeBase/locales/hi.json"),
  mr: require("../data/knowledgeBase/locales/mr.json"),
};

class RecommendationEngine {
  constructor() {
    // Initialize ML Model asynchronously
    qualityModel.trainModel();
  }

  /**
   * Process a Soil Report File
   */
  async processReport(imageBuffer, crop, language = "en") {
    // 1. OCR Extraction
    const text = await ocrService.extractText(imageBuffer);

    // 2. Strict Validation
    const validation = validationService.isValidSoilReport(text);
    if (!validation.isValid) {
      return {
        success: false,
        isInvalidReport: true, // Specific flag for UI
        message:
          this.getLocaleString(language, "validation.invalid_report") ||
          validation.message,
        confidence: validation.confidence,
      };
    }

    // 3. Data Parsing
    const soilData = ocrService.parseSoilReport(text);

    // 4. Generate Recommendations (Common Logic)
    return this.generateRecommendations(
      soilData,
      crop,
      language,
      validation.confidence,
    );
  }

  /**
   * Process Manual Entry Data
   */
  async processManualData(soilData, crop, language = "en") {
    return this.generateRecommendations(soilData, crop, language, 100); // 100% confidence in user input
  }

  /**
   * Core Logic: Expert System + ML Validation
   */
  generateRecommendations(soilData, crop, language, baseConfidence) {
    // 1. Expert System
    const expertResult = expertSystem.recommend(soilData, crop);

    // 2. ML Validation
    const totalDosage = expertResult.recommendations.reduce((acc, rec) => {
      // Extract number from "120 kg/ha" string
      const match = rec.dose.match(/(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    const mlValidation = qualityModel.validate(soilData, totalDosage);

    // Adjust Confidence based on ML
    let finalConfidence = baseConfidence;
    if (!mlValidation.isConsistent) {
      finalConfidence -= 60; // Major penalty if ML disagrees (Safety First)
    }

    // 3. Localization
    const localizedResult = this.localizeResult(expertResult, language, crop);

    const safeResponse = {
      soilHealth: localizedResult.soilHealth,
      recommendations: localizedResult.recommendations,
      overallConfidence: Math.max(0, finalConfidence),
      originalValues: soilData,
      warning: null,
    };

    // SAFETY GATE: Low Confidence Handling
    if (safeResponse.overallConfidence < 50) {
      safeResponse.warning = this.getLocaleString(
        language,
        "validation.low_confidence",
      );
      // Hide strong recommendations to prevent misuse
      safeResponse.recommendations = [];
      safeResponse.soilHealth += `\n\n⚠️ ${safeResponse.warning}`;
    }

    return {
      success: true,
      data: safeResponse,
    };
  }

  localizeResult(result, lang, crop) {
    const strings = locales[lang] || locales["en"];

    // Helper to get mapped term
    const getTerm = (category, key) =>
      strings[category] && strings[category][key]
        ? strings[category][key]
        : key;

    // Construct Summary
    let summary = strings.recommendation.soil_health_summary;
    if (result.status.nitrogen === "Low") {
      summary += `\n ${this.formatString(strings.recommendation.nitrogen_low, { value: "(Low)" })}`;
    }
    // Add more summary logic here if needed (P, K, etc.)

    return {
      soilHealth: summary,
      recommendations: result.recommendations.map((rec, index) => {
        // 1. Localize Product Name
        const localizedProduct = getTerm("fertilizers", rec.name);

        // 2. Localize Dosage (keep numbers, maybe translate unit if needed later)
        const localizedDosage = rec.dose;

        // 3. Localize Reasoning using Template
        // We need to reconstruct the context. This is a limitation of the current ExpertSystem returning a string 'reason'.
        // Ideally ExpertSystem should return structured reason { nutrient: 'N', status: 'Low', crop: 'Wheat' }.
        // For now, we will use a generic fallback or try to infer context if possible.
        // BETTER APPROACH FOR OFFLINE AI: Use the 'result.status' object we already have!

        // Let's generate a FRESH reasoning string from the data we have, ignoring the hardcoded English one.
        // We know: rec.name (Urea) -> likely linked to Nitrogen status.

        let reasoning = "";
        // Simple heuristic to match fertilizer to nutrient for reasoning generation
        if (rec.name === "Urea") {
          reasoning = this.formatTemplate(
            strings.recommendation.reasoning_template,
            {
              nutrient: getTerm("nutrients", "nitrogen"),
              status: getTerm("status", result.status.nitrogen),
              crop: getTerm("crops", crop.toLowerCase()) || crop, // Use passed crop!
              requirement: getTerm("status", "High"), // Simplified
            },
          );
        } else if (rec.name.includes("DAP")) {
          reasoning = this.formatTemplate(
            strings.recommendation.reasoning_template,
            {
              nutrient: getTerm("nutrients", "phosphorus"),
              status: getTerm("status", result.status.phosphorus),
              crop: getTerm("crops", crop.toLowerCase()) || crop,
              requirement: getTerm("status", "Medium"),
            },
          );
        } else if (rec.name.includes("MOP")) {
          reasoning = this.formatTemplate(
            strings.recommendation.reasoning_template,
            {
              nutrient: getTerm("nutrients", "potassium"),
              status: getTerm("status", result.status.potassium),
              crop: getTerm("crops", crop.toLowerCase()) || crop,
              requirement: getTerm("status", "Medium"),
            },
          );
        } else {
          // Fallback to English if we can't generate smart reasoning yet
          reasoning = result.reasoning[index];
        }

        return {
          product: localizedProduct,
          dosage: localizedDosage,
          reason: reasoning,
        };
      }),
    };
  }

  formatString(template, values) {
    return template.replace(/{{(\w+)}}/g, (match, key) => values[key] || match);
  }

  formatTemplate(template, values) {
    return template.replace(/{{(\w+)}}/g, (match, key) => values[key] || match);
  }

  getLocaleString(lang, path) {
    const keys = path.split(".");
    let current = locales[lang] || locales["en"];
    for (const key of keys) {
      if (current[key]) current = current[key];
      else return null;
    }
    return current;
  }
}

module.exports = new RecommendationEngine();
