// Load Knowledge Base
import soilStandards from "../../data/knowledgeBase/soil_standards.json";
import cropRequirements from "../../data/knowledgeBase/crop_requirements.json";
import fertilizers from "../../data/knowledgeBase/fertilizers.json";

class ExpertSystem {
  /**
   * Main Rule-Based Recommendation Logic
   * @param {Object} soilData { ph, nitrogen, phosphorus, potassium, organic_carbon }
   * @param {string} crop Selected Crop ID (e.g., 'wheat')
   * @returns {Object} { recommendations: [], reasoning: [], status: {} }
   */
  recommend(soilData, crop) {
    const recommendations = [];
    const reasoning = [];

    // 1. Classify Soil Status (Low/Medium/High)
    const status = this.classifyNutrients(soilData);

    // 2. Get Crop Requirements
    const cropReq = cropRequirements.crops[crop.toLowerCase()];
    console.log(`ExpertSystem: Crop '${crop}' Req found:`, !!cropReq, cropReq);

    if (!cropReq) {
      reasoning.push(
        `Crop data for '${crop}' not found. Using general standards.`,
      );
    }

    // 3. Generate N-P-K Recommendations
    const nRec = this.calculateFertilizer(
      status.nitrogen,
      "nitrogen",
      cropReq?.nutrient_requirement_kg_ha?.n,
    );
    const pRec = this.calculateFertilizer(
      status.phosphorus,
      "phosphorus",
      cropReq?.nutrient_requirement_kg_ha?.p,
    );
    const kRec = this.calculateFertilizer(
      status.potassium,
      "potassium",
      cropReq?.nutrient_requirement_kg_ha?.k,
    );

    if (nRec) {
      recommendations.push(nRec.fertilizer);
      reasoning.push(nRec.reason);
    }
    if (pRec) {
      recommendations.push(pRec.fertilizer);
      reasoning.push(pRec.reason);
    }
    if (kRec) {
      recommendations.push(kRec.fertilizer);
      reasoning.push(kRec.reason);
    }

    // 4. pH Correction Logic
    if (status.ph === "Acidic") {
      recommendations.push({
        name: "Lime",
        dose: "200-300 kg/ha",
        reason: "To neutralize acidic soil",
      });
    } else if (status.ph === "Alkaline") {
      recommendations.push({
        name: "Gypsum",
        dose: "500 kg/ha",
        reason: "To reduce soil salinity",
      });
    }

    return { recommendations, reasoning, status };
  }

  /**
   * Helper: Classify each nutrient level based on standards
   */
  classifyNutrients(data) {
    const standards = soilStandards.general_standards;
    const result = {};

    result.nitrogen = this.getLevel(data.nitrogen, standards.nitrogen);
    result.phosphorus = this.getLevel(data.phosphorus, standards.phosphorus);
    result.potassium = this.getLevel(data.potassium, standards.potassium);

    // pH Classification
    if (data.ph <= standards.ph.acidic.max) result.ph = "Acidic";
    else if (
      data.ph >= standards.ph.neutral.min &&
      data.ph <= standards.ph.neutral.max
    )
      result.ph = "Neutral";
    else result.ph = "Alkaline";

    return result;
  }

  getLevel(value, standard) {
    if (!value) return "Unknown";
    if (value <= standard.low.max) return "Low";
    if (value <= standard.medium.max) return "Medium";
    return "High";
  }

  /**
   * Helper: Calculate Fertilizer Product and Dosage
   */
  calculateFertilizer(status, type, cropTarget) {
    if (status === "High") {
      return {
        fertilizer: { name: "Maintain current practice", dose: "0 kg" },
        reason: `${type} is High. No extra fertilizer needed.`,
      };
    }

    // Find suitable fertilizer from KB
    let product;
    let dose = 0;
    let reason = "";

    if (type === "nitrogen") {
      product = fertilizers.fertilizers.find((f) => f.id === "urea");

      // Logic: Base calculation vs Crop Target
      if (cropTarget) {
        dose = cropTarget;
        reason = `Soil Nitrogen is ${status}. Recommended Urea to meet ${cropTarget} kg/ha crop demand.`;
      } else {
        dose = status === "Low" ? 120 : 80;
        reason = `Soil Nitrogen is ${status}. Recommended Urea to boost levels.`;
      }

      dose = Math.round(dose / 0.46); // Adjust for Urea (46%)
      console.log(
        `Calculate N: Status=${status}, Target=${cropTarget}, FinalDose=${dose}`,
      );
      return {
        fertilizer: { name: product.name, dose: `${dose} kg/ha` },
        reason,
      };
    }

    if (type === "phosphorus") {
      product = fertilizers.fertilizers.find((f) => f.id === "dap");

      if (cropTarget) {
        dose = cropTarget;
        reason = `Soil Phosphorus is ${status}. Recommended DAP to meet ${cropTarget} kg/ha crop demand.`;
      } else {
        dose = status === "Low" ? 60 : 40;
        reason = `Soil Phosphorus is ${status}. Recommended DAP to boost levels.`;
      }

      dose = Math.round(dose / 0.46); // Adjust for DAP (46% P)
      console.log(
        `Calculate P: Status=${status}, Target=${cropTarget}, FinalDose=${dose}`,
      );
      return {
        fertilizer: { name: product.name, dose: `${dose} kg/ha` },
        reason,
      };
    }

    if (type === "potassium") {
      product = fertilizers.fertilizers.find((f) => f.id === "mop");

      if (cropTarget) {
        dose = cropTarget;
        reason = `Soil Potassium is ${status}. Recommended MOP to meet ${cropTarget} kg/ha crop demand.`;
      } else {
        dose = status === "Low" ? 40 : 20;
        reason = `Soil Potassium is ${status}. Recommended MOP to boost levels.`;
      }

      dose = Math.round(dose / 0.6); // Adjust for MOP (60% K)
      console.log(
        `Calculate K: Status=${status}, Target=${cropTarget}, FinalDose=${dose}`,
      );
      return {
        fertilizer: { name: product.name, dose: `${dose} kg/ha` },
        reason,
      };
    }

    return null; // Should not happen for key nutrients
  }
}

export default new ExpertSystem();
