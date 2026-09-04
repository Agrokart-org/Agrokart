const fs = require("fs");
const path = require("path");
const officialRecommendations = require("../data/knowledgeBase/official_crop_recommendations.json");
const fertilizerConversionService = require("./FertilizerConversionService");
const soilStandards = require("../data/knowledgeBase/soil_standards.json");

class ExpertSystem {
  /**
   * Main Context-Aware Source-Grounded Recommendation Engine
   * @param {Object} soilData { ph, nitrogen, phosphorus, potassium, organic_carbon, soil_type, region, season, conditions }
   * @param {string} crop Selected crop ID (e.g., 'wheat', 'paddy', 'sugarcane', 'cotton', 'maize')
   * @returns {Object} Standardized recommendation output structure
   */
  recommend(soilData, crop) {
    // 1. Validate Input Data
    if (!soilData || typeof soilData !== "object") {
      return this.buildInsufficientDataResponse("No soil data provided.");
    }

    const cropKey = (crop || "").trim().toLowerCase();
    if (!cropKey) {
      return this.buildInsufficientDataResponse("Crop name is required.");
    }

    // 2. Strict Soil Data Validation (pH, N, P, K, Organic Carbon)
    const valError = this.validateSoilData(soilData);
    if (valError) {
      return {
        success: false,
        error: valError,
        insufficientData: false,
        recommendation_type: null,
        recommendationBasis: null,
        nutrientRequirement: null,
        soilAssessment: null,
        applicability: null,
        fertilizerConversion: null,
        source: null
      };
    }

    // 3. Structured Soil Assessment Layer (Classifies N, P, K, pH for display; NEVER calculates doses via naive subtraction)
    const soilAssessment = this.buildSoilAssessment(soilData);
    const status = this.classifyNutrients(soilData);

    // 4. Region Source Tracking (Explicit user vs default "Maharashtra")
    const regionSupplied = Boolean(soilData.region && soilData.region.toString().trim().length > 0);
    const finalRegion = regionSupplied ? soilData.region.toString().trim() : "Maharashtra";
    const regionSource = regionSupplied ? "user" : "default";

    // 5. Context-Aware Source Matching
    const matchResult = this.findApplicableOfficialRecommendation(cropKey, soilData);

    // LEVEL 4 (crop_only) or "none" MUST NOT automatically produce a fertilizer recommendation.
    if (!matchResult.record || matchResult.matchLevel === "crop_only" || matchResult.matchLevel === "none") {
      return this.buildInsufficientDataResponse(
        "A verified recommendation matching the supplied soil and agricultural conditions was not found."
      );
    }

    const matchedRec = matchResult.record;

    // Check Source Provenance Presence
    if (!matchedRec.source || !matchedRec.source.organization || !matchedRec.source.document || !matchedRec.source.page) {
      return this.buildInsufficientDataResponse(
        "Source provenance is missing for this recommendation."
      );
    }

    // 6. Construct Standardized Output Structure
    return {
      success: true,
      recommendation_type: "official_baseline_nutrient_requirement",
      recommendationBasis: {
        type: "official_baseline_plus_soil_assessment",
        officialSource: true,
        personalizedDoseCalculated: false
      },

      nutrientRequirement: {
        n_kg_ha: matchedRec.recommended_n_kg_ha,
        p2o5_kg_ha: matchedRec.recommended_p2o5_kg_ha,
        k2o_kg_ha: matchedRec.recommended_k2o_kg_ha
      },

      soilAssessment: soilAssessment,

      applicability: {
        crop: matchedRec.crop,
        region: finalRegion,
        regionSource: regionSource,
        season: matchedRec.season || null,
        soil_condition: matchedRec.soil_condition || null,
        conditions: matchedRec.conditions || null
      },

      fertilizerConversion: null, // Primary recommendation remains official nutrient requirement; conversion is NOT auto-populated here.

      source: {
        organization: matchedRec.source.organization,
        document: matchedRec.source.document,
        page: matchedRec.source.page,
        year: matchedRec.source.year || 2025
      },

      matchMetadata: {
        matchLevel: matchResult.matchLevel,
        matchConfidence: matchResult.matchConfidence
      },

      status: status
    };
  }

  /**
   * Perform Context-Aware Matching against Official Recommendations
   * Matching priority:
   * Level 1: crop + region + season + soil_condition + conditions (exact)
   * Level 2: crop + region + season (crop_region_season)
   * Level 3: crop + region (crop_region)
   * Level 4: crop only (crop_only -> MUST NOT produce recommendation)
   */
  findApplicableOfficialRecommendation(crop, soilData = {}) {
    if (!crop) return { record: null, matchLevel: "none", matchConfidence: "none" };

    const cropLower = crop.toLowerCase().trim();
    const candidates = officialRecommendations.filter(r => r.crop.toLowerCase() === cropLower);

    if (candidates.length === 0) {
      return { record: null, matchLevel: "none", matchConfidence: "none" };
    }

    const rawRegion = soilData.region ? soilData.region.toString().toLowerCase().trim() : null;
    const reqRegion = rawRegion || "maharashtra";
    const reqSeason = soilData.season ? soilData.season.toString().toLowerCase().trim() : null;
    const reqSoilType = (soilData.soil_type || soilData.soil_condition) ? (soilData.soil_type || soilData.soil_condition).toString().toLowerCase().trim() : null;
    const reqCondition = soilData.conditions ? soilData.conditions.toString().toLowerCase().trim() : null;

    const checkRegionMatch = (candReg) => {
      if (!candReg) return true;
      const cReg = candReg.toLowerCase();
      return cReg.includes(reqRegion) || reqRegion.includes(cReg) || cReg.includes("maharashtra") || reqRegion.includes("maharashtra");
    };

    // LEVEL 1 — Exact/high-confidence: crop + region + season + soil condition + condition
    for (const cand of candidates) {
      const regMatch = checkRegionMatch(cand.region);
      const seasMatch = !reqSeason || (cand.season && cand.season.toLowerCase() === reqSeason);
      const soilMatch = !reqSoilType || (cand.soil_condition && cand.soil_condition.toLowerCase().includes(reqSoilType));
      const condMatch = !reqCondition || (cand.conditions && cand.conditions.toLowerCase().includes(reqCondition));

      if (regMatch && seasMatch && soilMatch && condMatch && reqSeason && reqSoilType) {
        return { record: cand, matchLevel: "exact", matchConfidence: "high" };
      }
    }

    // LEVEL 2 — crop + region + season
    for (const cand of candidates) {
      const regMatch = checkRegionMatch(cand.region);
      const seasMatch = cand.season && reqSeason && cand.season.toLowerCase() === reqSeason;

      if (regMatch && seasMatch) {
        return { record: cand, matchLevel: "crop_region_season", matchConfidence: "medium" };
      }
    }

    // LEVEL 3 — crop + region
    for (const cand of candidates) {
      const regMatch = checkRegionMatch(cand.region);
      if (regMatch) {
        return { record: cand, matchLevel: "crop_region", matchConfidence: "medium" };
      }
    }

    // LEVEL 4 — crop only (MUST NOT produce a fertilizer recommendation)
    return { record: candidates[0], matchLevel: "crop_only", matchConfidence: "low" };
  }

  _parseNum(val) {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "number") {
      if (isNaN(val) || !isFinite(val)) return "INVALID";
      return val;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return null;
      const parsed = Number(trimmed);
      if (isNaN(parsed) || !isFinite(parsed)) return "INVALID";
      return parsed;
    }
    return "INVALID";
  }

  /**
   * Strict Soil Data Validation
   */
  validateSoilData(soilData) {
    if (!soilData || typeof soilData !== "object") {
      return "Invalid soil data format.";
    }

    // pH check: 0 <= pH <= 14
    if (soilData.ph !== undefined && soilData.ph !== null && soilData.ph !== "") {
      const ph = this._parseNum(soilData.ph);
      if (ph === "INVALID" || ph < 0 || ph > 14) {
        return "Invalid pH value. pH must be between 0 and 14.";
      }
      soilData.ph = ph;
    }

    // Nitrogen check: 0 <= nitrogen <= 500
    if (soilData.nitrogen !== undefined && soilData.nitrogen !== null && soilData.nitrogen !== "") {
      const n = this._parseNum(soilData.nitrogen);
      if (n === "INVALID" || n < 0 || n > 500) {
        return "Invalid Nitrogen value. Must be a numeric non-negative value within realistic range (0-500 kg/ha).";
      }
      soilData.nitrogen = n;
    }

    // Phosphorus check: 0 <= phosphorus <= 300
    if (soilData.phosphorus !== undefined && soilData.phosphorus !== null && soilData.phosphorus !== "") {
      const p = this._parseNum(soilData.phosphorus);
      if (p === "INVALID" || p < 0 || p > 300) {
        return "Invalid Phosphorus value. Must be a numeric non-negative value within realistic range (0-300 kg/ha).";
      }
      soilData.phosphorus = p;
    }

    // Potassium check: 0 <= potassium <= 400
    if (soilData.potassium !== undefined && soilData.potassium !== null && soilData.potassium !== "") {
      const k = this._parseNum(soilData.potassium);
      if (k === "INVALID" || k < 0 || k > 400) {
        return "Invalid Potassium value. Must be a numeric non-negative value within realistic range (0-400 kg/ha).";
      }
      soilData.potassium = k;
    }

    // Organic Carbon check
    if (soilData.organic_carbon !== undefined && soilData.organic_carbon !== null && soilData.organic_carbon !== "") {
      const oc = this._parseNum(soilData.organic_carbon);
      if (oc === "INVALID" || oc < 0 || oc > 50) {
        return "Invalid Organic Carbon value. Must be a non-negative number.";
      }
      soilData.organic_carbon = oc;
    }

    return null;
  }

  /**
   * Structured Soil Assessment
   */
  buildSoilAssessment(data) {
    if (!data) {
      return {
        nitrogen: { value: null, status: "Unknown" },
        phosphorus: { value: null, status: "Unknown" },
        potassium: { value: null, status: "Unknown" },
        ph: { value: null, status: "Unknown" }
      };
    }

    const status = this.classifyNutrients(data);

    return {
      nitrogen: {
        value: data.nitrogen !== undefined && data.nitrogen !== null ? data.nitrogen : null,
        status: status.nitrogen
      },
      phosphorus: {
        value: data.phosphorus !== undefined && data.phosphorus !== null ? data.phosphorus : null,
        status: status.phosphorus
      },
      potassium: {
        value: data.potassium !== undefined && data.potassium !== null ? data.potassium : null,
        status: status.potassium
      },
      ph: {
        value: data.ph !== undefined && data.ph !== null ? data.ph : null,
        status: status.ph
      }
    };
  }

  /**
   * Helper: Classify each nutrient level based on standards (For display only, NOT converted to doses)
   */
  classifyNutrients(data) {
    if (!data) return { nitrogen: "Unknown", phosphorus: "Unknown", potassium: "Unknown", ph: "Unknown" };

    const standards = soilStandards.general_standards;
    const result = {};

    result.nitrogen = this.getLevel(data.nitrogen, standards.nitrogen);
    result.phosphorus = this.getLevel(data.phosphorus, standards.phosphorus);
    result.potassium = this.getLevel(data.potassium, standards.potassium);

    if (data.ph === undefined || data.ph === null || isNaN(data.ph)) {
      result.ph = "Unknown";
    } else if (data.ph < 6.5) {
      result.ph = "Acidic";
    } else if (data.ph <= 7.5) {
      result.ph = "Neutral";
    } else {
      result.ph = "Alkaline";
    }

    return result;
  }

  getLevel(value, standard) {
    if (value === undefined || value === null || isNaN(value)) return "Unknown";
    if (value <= standard.low.max) return "Low";
    if (value <= standard.medium.max) return "Medium";
    return "High";
  }

  buildInsufficientDataResponse(message) {
    return {
      success: false,
      insufficientData: true,
      message: message || "A verified recommendation matching the supplied soil and agricultural conditions was not found.",
      recommendation_type: null,
      recommendationBasis: null,
      nutrientRequirement: null,
      soilAssessment: null,
      applicability: null,
      fertilizerConversion: null,
      source: null
    };
  }
}

module.exports = new ExpertSystem();
