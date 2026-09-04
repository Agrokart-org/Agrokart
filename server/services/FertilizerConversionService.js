/**
 * AgroKart Fertilizer Conversion Service
 * Converts required nutrient values (N, P2O5, K2O in kg/ha) into specific fertilizer product quantities
 * using verified FCO fertilizer compositions.
 *
 * Formula:
 *   fertilizer_quantity = required_nutrient / fertilizer_fraction
 *
 * Example:
 *   Required N = 46 kg/ha, Urea = 46% N (fraction 0.46)
 *   46 / 0.46 = 100 kg/ha Urea
 *
 * This is an explicit mathematical conversion based on FCO composition, NOT a source recommendation.
 */

const compositions = require("../data/knowledgeBase/fertilizer_compositions.json");

class FertilizerConversionService {
  /**
   * Get composition metadata for a fertilizer key.
   */
  getComposition(fertilizerKey) {
    const key = fertilizerKey ? fertilizerKey.toLowerCase() : "";
    return compositions[key] || null;
  }

  /**
   * Calculate fertilizer product quantity required for a given nutrient requirement.
   * @param {string} nutrientType 'N', 'P2O5', or 'K2O'
   * @param {number} requiredAmountKgHa Required nutrient mass in kg/ha
   * @param {string} fertilizerKey 'urea', 'dap', 'mop', 'ssp'
   * @returns {Object} { success: boolean, productQuantityKgHa: number, details: Object }
   */
  convertNutrientToProduct(nutrientType, requiredAmountKgHa, fertilizerKey) {
    if (
      requiredAmountKgHa === null ||
      requiredAmountKgHa === undefined ||
      typeof requiredAmountKgHa !== "number" ||
      isNaN(requiredAmountKgHa)
    ) {
      return {
        success: false,
        error: "Invalid or missing nutrient requirement amount.",
      };
    }

    if (requiredAmountKgHa < 0) {
      return {
        success: false,
        error: "Nutrient requirement cannot be negative.",
      };
    }

    if (fertilizerKey === null || fertilizerKey === undefined || typeof fertilizerKey !== "string") {
      return {
        success: false,
        error: "Unknown fertilizer product key.",
      };
    }

    const comp = this.getComposition(fertilizerKey);
    if (!comp) {
      return {
        success: false,
        error: `Unknown fertilizer product key '${fertilizerKey}'.`,
      };
    }

    if (nutrientType === null || nutrientType === undefined || typeof nutrientType !== "string") {
      return {
        success: false,
        error: "Unsupported nutrient type.",
      };
    }

    let fraction = 0;
    let percentage = 0;

    const nutUpper = nutrientType.trim().toUpperCase();
    if (nutUpper === "N" || nutUpper === "NITROGEN") {
      fraction = comp.n_fraction;
      percentage = comp.n_percentage;
    } else if (nutUpper === "P2O5" || nutUpper === "PHOSPHORUS" || nutUpper === "P") {
      fraction = comp.p2o5_fraction;
      percentage = comp.p2o5_percentage;
    } else if (nutUpper === "K2O" || nutUpper === "POTASSIUM" || nutUpper === "K") {
      fraction = comp.k2o_fraction;
      percentage = comp.k2o_percentage;
    } else {
      return {
        success: false,
        error: `Unsupported nutrient type '${nutrientType}'.`,
      };
    }

    if (!fraction || fraction <= 0) {
      return {
        success: false,
        error: `Fertilizer product '${comp.name}' does not supply nutrient '${nutrientType}'.`,
      };
    }

    if (requiredAmountKgHa === 0) {
      return {
        success: true,
        productName: comp.name,
        productKey: fertilizerKey.toLowerCase(),
        productQuantityKgHa: 0,
        nutrientType: nutUpper,
        requiredNutrientKgHa: 0,
        compositionPercentage: percentage,
        isMathematicalConversion: true,
        note: `Mathematical conversion based on ${comp.name} (${percentage}% ${nutUpper}). Quantity calculated from fertilizer composition; not an official source recommendation.`,
      };
    }

    // Mathematical calculation: required_nutrient / fraction
    const productQuantityKgHa = Math.round((requiredAmountKgHa / fraction) * 10) / 10;

    return {
      success: true,
      productName: comp.name,
      productKey: fertilizerKey.toLowerCase(),
      productQuantityKgHa: productQuantityKgHa,
      nutrientType: nutUpper,
      requiredNutrientKgHa: requiredAmountKgHa,
      compositionPercentage: percentage,
      isMathematicalConversion: true,
      note: `Mathematical conversion based on ${comp.name} (${percentage}% ${nutUpper}). Quantity calculated from fertilizer composition; not an official source recommendation.`,
    };
  }

  /**
   * Convert full N-P2O5-K2O nutrient requirement into standard straight fertilizer combo (Urea, DAP/SSP, MOP).
   */
  convertNPKToStandardFertilizers(reqN = 0, reqP2O5 = 0, reqK2O = 0) {
    if (
      reqN === null || reqN === undefined || typeof reqN !== "number" || isNaN(reqN) || reqN < 0 ||
      reqP2O5 === null || reqP2O5 === undefined || typeof reqP2O5 !== "number" || isNaN(reqP2O5) || reqP2O5 < 0 ||
      reqK2O === null || reqK2O === undefined || typeof reqK2O !== "number" || isNaN(reqK2O) || reqK2O < 0
    ) {
      return {
        success: false,
        error: "Invalid nutrient requirement. Nutrient amounts must be non-negative numbers.",
      };
    }

    const result = {
      success: true,
      urea_kg_ha: 0,
      dap_kg_ha: 0,
      mop_kg_ha: 0,
      conversions: [],
      basis: {
        type: "mathematical_fertilizer_conversion",
        source: "FCO fertilizer composition"
      }
    };

    let remainingN = reqN;

    // 1. Calculate DAP for P2O5 (DAP delivers 46% P2O5 and 18% N)
    if (reqP2O5 > 0) {
      const dapConv = this.convertNutrientToProduct("P2O5", reqP2O5, "dap");
      if (!dapConv.success) {
        return dapConv;
      }
      result.dap_kg_ha = dapConv.productQuantityKgHa;
      result.conversions.push(dapConv);

      // DAP also supplies Nitrogen: 18% of DAP mass
      const nFromDap = result.dap_kg_ha * 0.18;
      remainingN = Math.max(0, remainingN - nFromDap);
    }

    // 2. Calculate Urea for remaining Nitrogen (Urea delivers 46% N)
    if (remainingN > 0) {
      const ureaConv = this.convertNutrientToProduct("N", remainingN, "urea");
      if (!ureaConv.success) {
        return ureaConv;
      }
      result.urea_kg_ha = ureaConv.productQuantityKgHa;
      result.conversions.push(ureaConv);
    }

    // 3. Calculate MOP for K2O (MOP delivers 60% K2O)
    if (reqK2O > 0) {
      const mopConv = this.convertNutrientToProduct("K2O", reqK2O, "mop");
      if (!mopConv.success) {
        return mopConv;
      }
      result.mop_kg_ha = mopConv.productQuantityKgHa;
      result.conversions.push(mopConv);
    }

    return result;
  }
}

module.exports = new FertilizerConversionService();
