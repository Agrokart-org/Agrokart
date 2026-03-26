/**
 * Crop Nutrient Standards (Indian Agricultural Context)
 *
 * Standard NPK requirements for target yields.
 * Values are in kg/hectare.
 * Ranges are approximate optimal ranges for "Medium" soil fertility.
 *
 * Source: Derived from ICAR general recommendations and common agronomy handbooks.
 */

const cropStandards = {
  // CEREALS
  Wheat: {
    name: "Wheat",
    localNames: { hi: "Gehu", mr: "Gahu" },
    requirements: { n: 120, p: 60, k: 40 }, // High Nitrogen
    idealPH: { min: 6.0, max: 7.5 },
    durationDays: 120,
  },
  Rice: {
    name: "Rice/Paddy",
    localNames: { hi: "Chawal/Dhan", mr: "Tandul/Bhat" },
    requirements: { n: 100, p: 60, k: 60 },
    idealPH: { min: 5.5, max: 7.0 },
    durationDays: 140,
  },
  Maize: {
    name: "Maize",
    localNames: { hi: "Makka", mr: "Maka" },
    requirements: { n: 120, p: 60, k: 60 },
    idealPH: { min: 6.0, max: 7.0 },
    durationDays: 100,
  },

  // PULSES
  Chickpea: {
    name: "Chickpea/Gram",
    localNames: { hi: "Chana", mr: "Harbhara" },
    requirements: { n: 20, p: 60, k: 20 }, // Legume (fixes own N)
    idealPH: { min: 6.0, max: 7.5 },
    durationDays: 110,
  },
  Soybean: {
    name: "Soybean",
    localNames: { hi: "Soybean", mr: "Soybean" },
    requirements: { n: 30, p: 80, k: 40 }, // High P requirement
    idealPH: { min: 6.0, max: 7.0 },
    durationDays: 100,
  },

  // CASH CROPS
  Sugarcane: {
    name: "Sugarcane",
    localNames: { hi: "Ganna", mr: "Oos" },
    requirements: { n: 300, p: 100, k: 200 }, // Heavy Feeder
    idealPH: { min: 6.5, max: 8.0 },
    durationDays: 365,
  },
  Cotton: {
    name: "Cotton",
    localNames: { hi: "Kapas", mr: "Kapus" },
    requirements: { n: 100, p: 50, k: 50 },
    idealPH: { min: 6.0, max: 8.0 },
    durationDays: 160,
  },

  // VEGETABLES
  Tomato: {
    name: "Tomato",
    localNames: { hi: "Tamatar", mr: "Tomato" },
    requirements: { n: 100, p: 60, k: 80 },
    idealPH: { min: 6.0, max: 7.0 },
    durationDays: 120,
  },
  Potato: {
    name: "Potato",
    localNames: { hi: "Aloo", mr: "Batata" },
    requirements: { n: 120, p: 80, k: 100 }, // High Potash
    idealPH: { min: 5.0, max: 6.5 },
    durationDays: 90,
  },
  Onion: {
    name: "Onion",
    localNames: { hi: "Pyaz", mr: "Kanda" },
    requirements: { n: 100, p: 50, k: 80 },
    idealPH: { min: 6.0, max: 7.5 },
    durationDays: 110,
  },

  // FRUITS
  Banana: {
    name: "Banana",
    localNames: { hi: "Kela", mr: "Keli" },
    requirements: { n: 200, p: 60, k: 300 }, // Very high K
    idealPH: { min: 6.0, max: 7.5 },
    durationDays: 365,
  },

  // Defaults
  default: {
    name: "General Crop",
    localNames: { hi: "Samanya Fasal", mr: "Samanya Pik" },
    requirements: { n: 80, p: 40, k: 40 },
    idealPH: { min: 6.0, max: 7.5 },
    durationDays: 100,
  },
};

module.exports = cropStandards;
