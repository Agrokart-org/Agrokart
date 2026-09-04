/**
 * AgroKart Server - Dr. Agro Fertilizer Conversion Integration Test Suite
 */

const assert = require("assert");
const recommendationEngine = require("../services/RecommendationEngine");

async function runTests() {
  console.log("\n=======================================================");
  console.log("TEST: Dr. Agro Fertilizer Conversion Integration");
  console.log("=======================================================\n");

  // 1. Wheat Integration Test
  console.log("Running TEST 1: Wheat Integration...");
  const wheatInput = {
    crop: "wheat",
    ph: 6.5,
    nitrogen: 120,
    phosphorus: 40,
    potassium: 200,
    region: "Maharashtra",
    season: "rabi"
  };

  const wheatRes = await recommendationEngine.processManualData(wheatInput, wheatInput.crop, "en");
  assert.strictEqual(wheatRes.success, true);
  const wData = wheatRes.data;

  // Verify Official MPKV Baseline Preserved
  assert.strictEqual(wData.recommendation_type, "official_baseline_nutrient_requirement");
  assert.strictEqual(wData.recommendationBasis.officialSource, true);
  assert.strictEqual(wData.recommendationBasis.personalizedDoseCalculated, false);
  assert.strictEqual(wData.source.organization, "MPKV");
  assert.strictEqual(wData.nutrientRequirement.n_kg_ha, 120);
  assert.strictEqual(wData.nutrientRequirement.p2o5_kg_ha, 60);
  assert.strictEqual(wData.nutrientRequirement.k2o_kg_ha, 40);

  // Verify Mathematical Conversion Object
  assert.ok(wData.fertilizerConversion !== null && typeof wData.fertilizerConversion === "object");
  assert.strictEqual(wData.fertilizerConversion.basis.type, "mathematical_fertilizer_conversion");
  assert.strictEqual(wData.fertilizerConversion.basis.source, "FCO fertilizer composition");
  assert.strictEqual(wData.fertilizerConversion.basis.isOfficialAgronomicRecommendation, false);
  assert.strictEqual(wData.fertilizerConversion.dap_kg_ha, 130.4);
  assert.strictEqual(wData.fertilizerConversion.urea_kg_ha, 209.8);
  assert.strictEqual(wData.fertilizerConversion.mop_kg_ha, 66.7);

  // Verify Recommendations Array Labelling
  assert.strictEqual(wData.recommendations[0].product, "Official MPKV Nutrient Requirement");
  assert.strictEqual(wData.recommendations[0].is_mathematical_conversion, false);
  assert.strictEqual(wData.recommendations[1].product, "Mathematical Fertilizer Conversion");
  assert.strictEqual(wData.recommendations[1].is_mathematical_conversion, true);
  assert.ok(wData.recommendations[1].reason.includes("NOT an official MPKV product recommendation"));

  console.log("✓ TEST 1 Passed: Wheat baseline 120:60:40 returned with separate mathematical conversion (DAP: 130.4, Urea: 209.8, MOP: 66.7).");

  // 2. Sugarcane Integration Test (Suru season)
  console.log("\nRunning TEST 2: Sugarcane Suru Season Integration...");
  const sugarcaneInput = {
    crop: "sugarcane",
    ph: 7.2,
    nitrogen: 200,
    phosphorus: 60,
    potassium: 100,
    region: "Maharashtra",
    season: "suru"
  };

  const scRes = await recommendationEngine.processManualData(sugarcaneInput, sugarcaneInput.crop, "hi");
  assert.strictEqual(scRes.success, true);
  const scData = scRes.data;

  // Verify Suru Season Baseline 250:115:115
  assert.strictEqual(scData.nutrientRequirement.n_kg_ha, 250);
  assert.strictEqual(scData.nutrientRequirement.p2o5_kg_ha, 115);
  assert.strictEqual(scData.nutrientRequirement.k2o_kg_ha, 115);

  // Verify Mathematical Conversion derived from 250:115:115 (No soil subtraction)
  // DAP = 115 / 0.46 = 250 kg/ha
  // N from DAP = 250 * 0.18 = 45 kg N
  // Remaining N = 250 - 45 = 205 kg N
  // Urea = 205 / 0.46 = 445.7 kg/ha
  // MOP = 115 / 0.60 = 191.7 kg/ha
  assert.strictEqual(scData.fertilizerConversion.dap_kg_ha, 250);
  assert.strictEqual(scData.fertilizerConversion.urea_kg_ha, 445.7);
  assert.strictEqual(scData.fertilizerConversion.mop_kg_ha, 191.7);
  assert.strictEqual(scData.fertilizerConversion.basis.isOfficialAgronomicRecommendation, false);

  console.log("✓ TEST 2 Passed: Sugarcane Suru baseline 250:115:115 returned without soil subtraction; conversion derived as DAP: 250, Urea: 445.7, MOP: 191.7.");

  // 3. Invalid Input Test
  console.log("\nRunning TEST 3: Invalid Soil Data Handling...");
  const invalidInput = { crop: "wheat", ph: 15, nitrogen: 120 };
  const invalidRes = await recommendationEngine.processManualData(invalidInput, invalidInput.crop, "en");
  assert.strictEqual(invalidRes.success, false);
  assert.ok(invalidRes.message.includes("pH"));

  console.log("✓ TEST 3 Passed: Invalid pH (15) rejected by validation.");

  // 4. Unknown Crop Test
  console.log("\nRunning TEST 4: Unknown Crop Handling...");
  const unknownCropInput = { crop: "dragonfruit_unknown", ph: 6.5 };
  const unknownRes = await recommendationEngine.processManualData(unknownCropInput, unknownCropInput.crop, "en");
  assert.strictEqual(unknownRes.success, false);
  assert.strictEqual(unknownRes.insufficientData, true);

  console.log("✓ TEST 4 Passed: Unknown crop handled cleanly as insufficientData.");

  console.log("\n🎉 ALL DR. AGRO FERTILIZER INTEGRATION TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
