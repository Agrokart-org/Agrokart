const ocrService = require("./OcrService");
const validationService = require("./ValidationService");
const expertSystem = require("./ExpertSystem");
const fertilizerConversionService = require("./FertilizerConversionService");
const aiService = require("./aiService");

class RecommendationEngine {
  constructor() {
    // Note: ML / Random Forest model training is explicitly disabled to prevent unverified inference.
  }

  /**
   * Process a Soil Report File
   */
  async processReport(imageBuffer, crop, language = "en", contextData = {}) {
    // 1. OCR Extraction (supports Buffer or String for deterministic testing)
    let text = "";
    if (typeof imageBuffer === "string") {
      text = imageBuffer;
    } else {
      text = await ocrService.extractText(imageBuffer);
    }

    // 2. Strict Validation
    const validation = validationService.isValidSoilReport(text);
    if (!validation.isValid) {
      return {
        success: false,
        isInvalidReport: true, // Specific flag for UI
        message: validation.message || "Invalid soil report document.",
        confidence: validation.confidence,
      };
    }

    // 3. Data Parsing
    const parsedData = ocrService.parseSoilReport(text);
    const soilData = { ...contextData, ...parsedData };

    // 4. Generate Source-Grounded Recommendations
    return this.generateRecommendations(
      soilData,
      crop,
      language,
      validation.confidence
    );
  }

  /**
   * Process Manual Entry Data
   */
  async processManualData(soilData, crop, language = "en") {
    return this.generateRecommendations(soilData, crop, language, 100);
  }

  /**
   * Core Logic: Expert System Source-Grounded Recommendations
   */
  generateRecommendations(soilData, crop, language, baseConfidence) {
    // 1. Source-Grounded Expert System
    const expertResult = expertSystem.recommend(soilData, crop);

    if (!expertResult.success) {
      return {
        success: false,
        insufficientData: expertResult.insufficientData || false,
        message: expertResult.message || expertResult.error || "A verified recommendation matching the supplied soil and agricultural conditions was not found.",
        data: {
          recommendation_type: null,
          recommendationBasis: null,
          nutrientRequirement: null,
          soilAssessment: null,
          applicability: null,
          fertilizerConversion: null,
          source: null,
          evidence: {
            available: false,
            source: null,
            supportingText: null,
            retrievalType: null,
          },
          soilHealth: expertResult.message || "A verified recommendation matching the supplied soil and agricultural conditions was not found.",
          recommendations: []
        }
      };
    }

    const sa = expertResult.soilAssessment;
    const soilSummary = sa ? `N (${sa.nitrogen.status}), P (${sa.phosphorus.status}), K (${sa.potassium.status}), pH (${sa.ph.status})` : "Standard";

    // 2. Mathematical Fertilizer Conversion (FCO Compositions — derived ONLY from official baseline targets, NOT soil subtraction)
    const n = expertResult.nutrientRequirement.n_kg_ha;
    const p = expertResult.nutrientRequirement.p2o5_kg_ha;
    const k = expertResult.nutrientRequirement.k2o_kg_ha;

    const conversionResult = fertilizerConversionService.convertNPKToStandardFertilizers(n, p, k);

    const fertilizerConversion = conversionResult && conversionResult.success
      ? {
          basis: {
            type: conversionResult.basis.type,
            source: conversionResult.basis.source,
            isOfficialAgronomicRecommendation: false,
          },
          urea_kg_ha: conversionResult.urea_kg_ha,
          dap_kg_ha: conversionResult.dap_kg_ha,
          mop_kg_ha: conversionResult.mop_kg_ha,
          conversions: conversionResult.conversions,
        }
      : null;

    // 3. Structured RAG Document Evidence Layer
    const evidence = this.buildEvidence(expertResult);

    // 4. Grounded Multilingual AI Explanation Layer (isolated safely so LLM errors never affect recommendations)
    let aiExplanation = { available: false, message: "AI explanation unavailable." };
    try {
      aiExplanation = aiService.generateVerifiedExplanation(
        {
          crop: crop || expertResult.applicability.crop,
          soilAssessment: expertResult.soilAssessment,
          officialRecommendation: expertResult.nutrientRequirement,
          applicability: expertResult.applicability,
          fertilizerConversion: fertilizerConversion,
          evidence: evidence,
        },
        language
      );
    } catch (aiErr) {
      console.warn("AI explanation generation warning:", aiErr.message);
    }

    const safeResponse = {
      recommendation_type: expertResult.recommendation_type,
      recommendationBasis: expertResult.recommendationBasis,
      nutrientRequirement: expertResult.nutrientRequirement,
      soilAssessment: expertResult.soilAssessment,
      applicability: expertResult.applicability,
      fertilizerConversion: fertilizerConversion,
      source: expertResult.source,
      evidence: evidence,
      aiExplanation: aiExplanation,
      matchMetadata: expertResult.matchMetadata,
      overallConfidence: baseConfidence,
      originalValues: soilData,
      soilHealth: `Official MPKV Baseline Recommendation (${expertResult.source.document}, p. ${expertResult.source.page}) with soil assessment: ${soilSummary}. Note: Baseline recommendations represent official research targets, not a direct subtraction from soil-test values.`,
      recommendations: [
        {
          product: "Official MPKV Nutrient Requirement",
          dosage: `${n}:${p}:${k} N:P2O5:K2O kg/ha`,
          reason: `Official ${expertResult.source.organization} baseline recommendation from ${expertResult.source.document} (p. ${expertResult.source.page}). Note: This represents the official research baseline requirement, not a naive subtraction from soil-test values.`,
          is_mathematical_conversion: false
        }
      ]
    };

    if (fertilizerConversion) {
      const parts = [];
      if (fertilizerConversion.dap_kg_ha > 0) parts.push(`DAP: ${fertilizerConversion.dap_kg_ha} kg/ha`);
      if (fertilizerConversion.urea_kg_ha > 0) parts.push(`Urea: ${fertilizerConversion.urea_kg_ha} kg/ha`);
      if (fertilizerConversion.mop_kg_ha > 0) parts.push(`MOP: ${fertilizerConversion.mop_kg_ha} kg/ha`);

      safeResponse.recommendations.push({
        product: "Mathematical Fertilizer Conversion",
        dosage: parts.length > 0 ? parts.join(", ") : "0 kg/ha",
        reason: `Mathematical conversion based on standard FCO fertilizer compositions to supply ${n}:${p}:${k} N:P2O5:K2O kg/ha. Calculated mathematically; NOT an official MPKV product recommendation.`,
        is_mathematical_conversion: true,
      });
    }

    return {
      success: true,
      data: safeResponse,
    };
  }

  /**
   * Build supporting RAG document evidence object from official recommendation source
   */
  buildEvidence(expertResult) {
    if (!expertResult || !expertResult.success || !expertResult.source || !expertResult.source.document) {
      return {
        available: false,
        source: null,
        supportingText: null,
        retrievalType: null,
      };
    }

    const docName = expertResult.source.document;
    const org = expertResult.source.organization || "MPKV";
    const pageNum = expertResult.source.page || 1;
    const cropName = expertResult.applicability ? expertResult.applicability.crop : "crop";
    const seasonName = expertResult.applicability ? expertResult.applicability.season : null;
    const regionName = expertResult.applicability ? expertResult.applicability.region : "Maharashtra";
    const req = expertResult.nutrientRequirement;

    const seasonStr = seasonName ? ` (${seasonName} season)` : "";
    const supportingText = `Official ${org} research target for ${cropName}${seasonStr} in ${regionName}: ${req.n_kg_ha}:${req.p2o5_kg_ha}:${req.k2o_kg_ha} N:P2O5:K2O kg/ha. Verified in research document ${docName} (p. ${pageNum}). Baseline recommendations represent research target doses, not naive subtraction from soil test values.`;

    return {
      available: true,
      source: {
        organization: org,
        document: docName,
        page: pageNum,
      },
      supportingText: supportingText,
      retrievalType: "official_document",
    };
  }
}

module.exports = new RecommendationEngine();
