/**
 * Fertilizer Composition Data
 *
 * Defines the nutrient content of standard fertilizers.
 * Used to calculate the quantity required to meet a nutrient deficit.
 */

const fertilizers = {
  Urea: {
    name: "Urea (46% N)",
    type: "Nitrogen",
    composition: { n: 0.46, p: 0, k: 0 },
    efficiency: 0.5, // Only about 50% of applied N is used by plants (volatilization)
    bagSize: 45, // 45kg bags are standard now in India (Neem Coated)
  },
  DAP: {
    name: "DAP (18-46-0)",
    type: "Phosphorus (Complex)",
    composition: { n: 0.18, p: 0.46, k: 0 },
    efficiency: 0.3, // P fixation is high
    bagSize: 50,
  },
  SSP: {
    name: "SSP (16% P)",
    type: "Phosphorus (Single)",
    composition: { n: 0, p: 0.16, k: 0 },
    efficiency: 0.3,
    bagSize: 50,
  },
  MOP: {
    name: "MOP (60% K)",
    type: "Potassium",
    composition: { n: 0, p: 0, k: 0.6 },
    efficiency: 0.7,
    bagSize: 50,
  },
  NPK_10_26_26: {
    name: "NPK 10:26:26",
    type: "Complex",
    composition: { n: 0.1, p: 0.26, k: 0.26 },
    efficiency: 0.6,
    bagSize: 50,
  },
  NPK_12_32_16: {
    name: "NPK 12:32:16",
    type: "Complex",
    composition: { n: 0.12, p: 0.32, k: 0.16 },
    efficiency: 0.6,
    bagSize: 50,
  },

  // Soil Amendments (Correction items)
  Gypsum: {
    name: "Gypsum",
    type: "Amendment",
    purpose: "Recover Saline/Alkaline Soil (pH > 8.5)",
    baseDosage: 500, // kg/ha baseline
  },
  Lime: {
    name: "Agricultural Lime",
    type: "Amendment",
    purpose: "Recover Acidic Soil (pH < 5.5)",
    baseDosage: 300, // kg/ha baseline
  },
};

module.exports = fertilizers;
