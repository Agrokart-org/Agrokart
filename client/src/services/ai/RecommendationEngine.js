import ocrService from "./OcrService";
import validationService from "./ValidationService";
import expertSystem from "./ExpertSystem";
import qualityModel from "./QualityModel";

// Load Locales
import en from "../../data/knowledgeBase/locales/en.json";
import hi from "../../data/knowledgeBase/locales/hi.json";
import mr from "../../data/knowledgeBase/locales/mr.json";

const locales = { en, hi, mr };

class RecommendationEngine {
  constructor() {
    // ML Model is auto-trained in its constructor on Frontend
  }

  /**
   * Process a Soil Report File (True Offline)
   */
  async processReport(
    imageFile,
    crop,
    language = "en",
    landArea = null,
    landUnit = "acre",
  ) {
    // 1. OCR Extraction (Browser Tesseract)
    let text = "";
    try {
      text = await ocrService.extractText(imageFile);
    } catch (e) {
      return {
        success: false,
        message:
          this.getLocaleString(language, "validation.invalid_report") ||
          "Could not read image.",
      };
    }

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
      landArea,
      landUnit,
    );
  }

  /**
   * Process Manual Entry Data
   */
  async processManualData(
    soilData,
    crop,
    language = "en",
    landArea = null,
    landUnit = "acre",
  ) {
    return this.generateRecommendations(
      soilData,
      crop,
      language,
      100,
      landArea,
      landUnit,
    ); // 100% confidence in user input
  }

  /**
   * Core Logic: Expert System + ML Validation
   */
  generateRecommendations(
    soilData,
    crop,
    language,
    baseConfidence,
    landArea = null,
    landUnit = "acre",
  ) {
    console.log(
      "%c=== Dr. Agro Recommendation Engine ===",
      "color: green; font-weight: bold",
    );
    console.log("Input Soil Data:", soilData);
    console.log("Selected Crop:", crop);
    console.log("Base Confidence:", baseConfidence);

    // 1. Expert System
    const expertResult = expertSystem.recommend(soilData, crop);
    console.log("Expert System Result:", expertResult);

    // 2. ML Validation
    const totalDosage = expertResult.recommendations.reduce((acc, rec) => {
      // Extract number from "120 kg/ha" string
      const match = rec.dose.match(/(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    const mlValidation = qualityModel.validate(soilData, totalDosage);
    console.log("ML Validation:", mlValidation);

    // Adjust Confidence based on ML
    let finalConfidence = baseConfidence;
    if (!mlValidation.isConsistent) {
      finalConfidence -= 60; // Major penalty if ML disagrees (Safety First)
    }

    // 3. Localization
    const localizedResult = this.localizeResult(
      expertResult,
      language,
      crop,
      landArea,
      landUnit,
    );
    console.log("Localized Result:", localizedResult);

    const safeResponse = {
      soilHealth: localizedResult.soilHealth,
      recommendations: localizedResult.recommendations,
      overallConfidence: Math.max(0, finalConfidence),
      originalValues: soilData,
      warning: null,
    };

    // SAFETY GATE: Low Confidence Handling (Lowered to 30 for better OCR tolerance)
    if (safeResponse.overallConfidence < 30) {
      safeResponse.warning = this.getLocaleString(
        language,
        "validation.low_confidence",
      );
      // Hide strong recommendations to prevent misuse
      safeResponse.recommendations = [];
      safeResponse.soilHealth += `\n\n⚠️ ${safeResponse.warning}`;
    } else if (safeResponse.overallConfidence < 50) {
      // Show recommendations but with warning
      safeResponse.warning =
        "Moderate confidence - please verify with an agricultural expert.";
    }

    console.log("%c=== Final Response ===", "color: blue; font-weight: bold");
    console.log("Overall Confidence:", safeResponse.overallConfidence);
    console.log("Recommendations Count:", safeResponse.recommendations.length);
    console.log("Recommendations:", safeResponse.recommendations);

    return {
      success: true,
      data: safeResponse,
    };
  }

  localizeResult(result, lang, crop, landArea = null, landUnit = "acre") {
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
        let reasoning = "";
        // Simple heuristic to match fertilizer to nutrient for reasoning generation
        if (rec.name === "Urea") {
          reasoning = this.formatTemplate(
            strings.recommendation.reasoning_template,
            {
              nutrient: getTerm("nutrients", "nitrogen"),
              status: getTerm("status", result.status.nitrogen),
              crop: getTerm("crops", crop.toLowerCase()) || crop,
              requirement: getTerm("status", "High"),
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
          // Fallback
          reasoning = result.reasoning[index];
        }

        // 4. Calculate Total Quantity if Land Area is provided
        let totalQty = null;
        if (landArea && rec.dose) {
          const val = parseInt(rec.dose);
          if (!isNaN(val)) {
            // Convert to Hectares (1 Acre = ~0.4047 Ha)
            const areaInHa = landUnit === "acre" ? landArea * 0.4047 : landArea;
            const total = Math.ceil(val * areaInHa);
            totalQty = `${total} kg`;
          }
        }

        return {
          product: localizedProduct,
          dosage: localizedDosage,
          reason: reasoning,
          totalQuantity: totalQty,
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

export default new RecommendationEngine();
