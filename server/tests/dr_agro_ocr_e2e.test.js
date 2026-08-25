/**
 * AgroKart Server - Dr. Agro End-to-End OCR Pipeline Test Suite
 */

const assert = require("assert");
const recommendationEngine = require("../services/RecommendationEngine");
const ocrService = require("../services/OcrService");

async function runTests() {
  console.log("\n=======================================================");
  console.log("TEST: Dr. Agro End-to-End OCR Pipeline");
  console.log("=======================================================\n");

  // Test 1 — Valid Wheat Report
  console.log("Running Test 1: Valid Wheat OCR Report...");
  const validWheatText = `
    Official Agriculture Department Soil Test Report
    Soil Health Card Sample ID: SHC-2025-9812
    pH: 6.5
    Nitrogen: 120 kg/ha
    Phosphorus: 40 kg/ha
    Potassium: 200 kg/ha
    Organic Carbon: 0.55 %
    Laboratory Analysis Complete.
  `;

  // Verify direct parsing
  const parsedWheat = ocrService.parseSoilReport(validWheatText);
  assert.strictEqual(parsedWheat.ph, 6.5);
  assert.strictEqual(parsedWheat.nitrogen, 120);
  assert.strictEqual(parsedWheat.phosphorus, 40);
  assert.strictEqual(parsedWheat.potassium, 200);
  assert.strictEqual(parsedWheat.organic_carbon, 0.55);

  // E2E report processing
  const res1 = await recommendationEngine.processReport(
    validWheatText,
    "wheat",
    "en",
    { region: "Maharashtra", season: "rabi" }
  );

  assert.strictEqual(res1.success, true);
  const d1 = res1.data;
  assert.strictEqual(d1.recommendation_type, "official_baseline_nutrient_requirement");
  assert.strictEqual(d1.source.organization, "MPKV");
  assert.strictEqual(d1.source.document, "MPKV_Wheat.pdf");
  assert.strictEqual(d1.source.page, 2);

  // Official Nutrient Target
  assert.strictEqual(d1.nutrientRequirement.n_kg_ha, 120);
  assert.strictEqual(d1.nutrientRequirement.p2o5_kg_ha, 60);
  assert.strictEqual(d1.nutrientRequirement.k2o_kg_ha, 40);

  // Fertilizer Conversion Separation
  assert.ok(d1.fertilizerConversion !== null);
  assert.strictEqual(d1.fertilizerConversion.basis.isOfficialAgronomicRecommendation, false);
  assert.strictEqual(d1.fertilizerConversion.dap_kg_ha, 130.4);
  assert.strictEqual(d1.fertilizerConversion.urea_kg_ha, 209.8);
  assert.strictEqual(d1.fertilizerConversion.mop_kg_ha, 66.7);
  assert.strictEqual(d1.recommendations[0].is_mathematical_conversion, false);
  assert.strictEqual(d1.recommendations[1].is_mathematical_conversion, true);

  console.log("✓ Test 1 Passed: Valid Wheat report successfully parsed, matched MPKV baseline (120:60:40), and generated mathematical conversion.");

  // Test 2 — Missing Nutrient (Potassium absent)
  console.log("\nRunning Test 2: Missing Nutrient (Potassium absent)...");
  const missingPotassiumText = `
    Official Agriculture Department Soil Test Report
    Soil Sample ID: SHC-2025-9813
    pH: 6.5
    Nitrogen: 120 kg/ha
    Phosphorus: 40 kg/ha
    Organic Carbon: 0.50 %
  `;

  const parsedMissingK = ocrService.parseSoilReport(missingPotassiumText);
  assert.strictEqual(parsedMissingK.ph, 6.5);
  assert.strictEqual(parsedMissingK.nitrogen, 120);
  assert.strictEqual(parsedMissingK.phosphorus, 40);
  assert.strictEqual(parsedMissingK.potassium, null);

  const res2 = await recommendationEngine.processReport(
    missingPotassiumText,
    "wheat",
    "en",
    { region: "Maharashtra", season: "rabi" }
  );

  assert.strictEqual(res2.success, true);
  const d2 = res2.data;
  assert.strictEqual(d2.soilAssessment.potassium.value, null);
  assert.strictEqual(d2.soilAssessment.potassium.status, "Unknown");
  console.log("✓ Test 2 Passed: Missing potassium preserved as null/Unknown without fabrication.");

  // Test 3 — Invalid pH
  console.log("\nRunning Test 3: Invalid pH (15)...");
  const invalidPhText = `
    Official Agriculture Department Soil Test Report
    Sample ID: SHC-2025-9814
    pH: 15
    Nitrogen: 120 kg/ha
    Phosphorus: 40 kg/ha
    Potassium: 200 kg/ha
  `;

  const res3 = await recommendationEngine.processReport(
    invalidPhText,
    "wheat",
    "en",
    { region: "Maharashtra", season: "rabi" }
  );

  assert.strictEqual(res3.success, false);
  assert.ok(res3.message.includes("pH"));
  console.log("✓ Test 3 Passed: Invalid pH (15) rejected by validation.");

  // Test 4 — Invalid/Non-Soil Document
  console.log("\nRunning Test 4: Invalid/Non-Soil Document...");
  const nonSoilText = `
    Shopping List
    1. Milk - 2 Liters
    2. White Bread - 1 Packet
    3. Eggs - 1 Dozen
    4. Apples - 1 kg
  `;

  const res4 = await recommendationEngine.processReport(nonSoilText, "wheat", "en");
  assert.strictEqual(res4.success, false);
  assert.strictEqual(res4.isInvalidReport, true);
  console.log("✓ Test 4 Passed: Non-soil document correctly flagged as isInvalidReport: true.");

  // Test 5 — Sugarcane OCR Report
  console.log("\nRunning Test 5: Sugarcane OCR Report...");
  const sugarcaneOcrText = `
    Official Agricultural Soil Test Report Card
    Laboratory Sample No: SL-88412
    pH: 7.2
    Nitrogen: 200 kg/ha
    Phosphorus: 60 kg/ha
    Potassium: 100 kg/ha
    Organic Carbon: 0.60 %
  `;

  const res5 = await recommendationEngine.processReport(
    sugarcaneOcrText,
    "sugarcane",
    "hi",
    { region: "Maharashtra", season: "suru" }
  );

  assert.strictEqual(res5.success, true);
  const d5 = res5.data;
  assert.strictEqual(d5.source.document, "MPKV_Sugarcane.pdf");
  assert.strictEqual(d5.nutrientRequirement.n_kg_ha, 250);
  assert.strictEqual(d5.nutrientRequirement.p2o5_kg_ha, 115);
  assert.strictEqual(d5.nutrientRequirement.k2o_kg_ha, 115);
  assert.strictEqual(d5.fertilizerConversion.dap_kg_ha, 250);
  assert.strictEqual(d5.fertilizerConversion.urea_kg_ha, 445.7);
  assert.strictEqual(d5.fertilizerConversion.mop_kg_ha, 191.7);
  console.log("✓ Test 5 Passed: Sugarcane OCR report routed to same ExpertSystem Suru baseline (250:115:115).");

  console.log("\n🎉 ALL DR. AGRO OCR E2E TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
