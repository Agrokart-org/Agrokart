/**
 * AgroKart Server - Source-Grounded Recommendation & Soil Assessment Test Suite
 */

const assert = require("assert");
const expertSystem = require("../services/ExpertSystem");
const recommendationEngine = require("../services/RecommendationEngine");
const fertilizerConversionService = require("../services/FertilizerConversionService");
const officialRecommendations = require("../data/knowledgeBase/official_crop_recommendations.json");

function runTests() {
  console.log("\n=======================================================");
  console.log("TEST: Dr. Agro Context-Aware Source Matching & Soil Assessment");
  console.log("=======================================================");

  // 1. Wheat Valid Request
  console.log("Running TEST 1: Wheat Valid Request...");
  const wheatRes = expertSystem.recommend(
    { ph: 6.8, nitrogen: 140, phosphorus: 25, potassium: 180, region: "Maharashtra", season: "rabi" },
    "wheat"
  );
  assert.strictEqual(wheatRes.success, true);
  assert.strictEqual(wheatRes.recommendation_type, "official_baseline_nutrient_requirement");
  assert.strictEqual(wheatRes.nutrientRequirement.n_kg_ha, 120);
  assert.strictEqual(wheatRes.nutrientRequirement.p2o5_kg_ha, 60);
  assert.strictEqual(wheatRes.nutrientRequirement.k2o_kg_ha, 40);
  assert.strictEqual(wheatRes.recommendationBasis.personalizedDoseCalculated, false);
  assert.strictEqual(wheatRes.applicability.regionSource, "user");
  console.log("✓ TEST 1 Passed: Wheat baseline returned with user-supplied region and official basis.");

  // 2. Paddy Valid Request
  console.log("Running TEST 2: Paddy Valid Request...");
  const paddyRes = expertSystem.recommend(
    { ph: 6.5, nitrogen: 100, phosphorus: 20, potassium: 150, season: "kharif" },
    "paddy"
  );
  assert.strictEqual(paddyRes.success, true);
  assert.strictEqual(paddyRes.crop, undefined); // Response uses applicability.crop
  assert.strictEqual(paddyRes.nutrientRequirement.n_kg_ha, 100);
  assert.strictEqual(paddyRes.nutrientRequirement.p2o5_kg_ha, 50);
  assert.strictEqual(paddyRes.nutrientRequirement.k2o_kg_ha, 50);
  assert.strictEqual(paddyRes.applicability.regionSource, "default");
  console.log("✓ TEST 2 Passed: Paddy baseline returned with default regionSource='default'.");

  // 3. Sugarcane Season Matching (Suru vs Preseasonal)
  console.log("Running TEST 3: Sugarcane Season Matching...");
  const suruRes = expertSystem.recommend(
    { ph: 7.2, nitrogen: 200, phosphorus: 30, potassium: 200, season: "suru" },
    "sugarcane"
  );
  assert.strictEqual(suruRes.success, true);
  assert.strictEqual(suruRes.nutrientRequirement.n_kg_ha, 250);
  assert.strictEqual(suruRes.source.page, 6);

  const preRes = expertSystem.recommend(
    { ph: 7.2, nitrogen: 200, phosphorus: 30, potassium: 200, season: "preseasonal" },
    "sugarcane"
  );
  assert.strictEqual(preRes.success, true);
  assert.strictEqual(preRes.nutrientRequirement.n_kg_ha, 300);
  assert.strictEqual(preRes.source.page, 7);
  console.log("✓ TEST 3 Passed: Sugarcane season matching distinguishes Suru (250 kg N) vs Preseasonal (300 kg N).");

  // 4. Unknown Crop
  console.log("Running TEST 4: Unknown Crop...");
  const unknownRes = expertSystem.recommend({ ph: 7.0, nitrogen: 100 }, "dragonfruit");
  assert.strictEqual(unknownRes.success, false);
  assert.strictEqual(unknownRes.insufficientData, true);
  console.log("✓ TEST 4 Passed: Unknown crop returns insufficient data response.");

  // 5. Missing Crop
  console.log("Running TEST 5: Missing Crop...");
  const missingCropRes = expertSystem.recommend({ ph: 7.0 }, "");
  assert.strictEqual(missingCropRes.success, false);
  assert.strictEqual(missingCropRes.insufficientData, true);
  console.log("✓ TEST 5 Passed: Missing crop returns insufficient data response.");

  // 6. Invalid pH (-1 and 15)
  console.log("Running TEST 6: Invalid pH...");
  const phNeg = expertSystem.recommend({ ph: -1, nitrogen: 100 }, "wheat");
  assert.strictEqual(phNeg.success, false);
  assert.strictEqual(phNeg.error.includes("pH"), true);

  const phHigh = expertSystem.recommend({ ph: 15, nitrogen: 100 }, "wheat");
  assert.strictEqual(phHigh.success, false);
  assert.strictEqual(phHigh.error.includes("pH"), true);
  console.log("✓ TEST 6 Passed: Invalid pH (-1, 15) rejected.");

  // 7. Impossible N/P/K (N=700, K=500)
  console.log("Running TEST 7: Impossible N/P/K...");
  const impRes = expertSystem.recommend({ ph: 7.0, nitrogen: 700, potassium: 500 }, "wheat");
  assert.strictEqual(impRes.success, false);
  assert.strictEqual(impRes.error.includes("Nitrogen"), true);
  console.log("✓ TEST 7 Passed: Extreme/impossible N=700 rejected.");

  // 8. Missing N/P/K (soilAssessment classification)
  console.log("Running TEST 8: Missing N/P/K & Soil Assessment...");
  const missingNPKRes = expertSystem.recommend({ ph: 6.8, region: "Maharashtra", season: "rabi" }, "wheat");
  assert.strictEqual(missingNPKRes.success, true);
  assert.strictEqual(missingNPKRes.soilAssessment.nitrogen.value, null);
  assert.strictEqual(missingNPKRes.soilAssessment.nitrogen.status, "Unknown");
  assert.strictEqual(missingNPKRes.soilAssessment.ph.value, 6.8);
  assert.strictEqual(missingNPKRes.soilAssessment.ph.status, "Neutral");
  console.log("✓ TEST 8 Passed: Missing N/P/K remains null/'Unknown' in soilAssessment (no default values).");

  // 9. Provenance Missing
  console.log("Running TEST 9: Missing Provenance Check...");
  officialRecommendations.push({
    crop: "fakecrop",
    region: "Maharashtra",
    recommended_n_kg_ha: 50,
    source: null
  });
  const noProvRes = expertSystem.recommend({ ph: 7.0 }, "fakecrop");
  assert.strictEqual(noProvRes.success, false);
  officialRecommendations.pop();
  console.log("✓ TEST 9 Passed: Recommendation without provenance rejected.");

  // 10. Default Maharashtra Region vs User Region
  console.log("Running TEST 10: Region Source Verification...");
  const userReg = expertSystem.recommend({ ph: 7.0, region: "Pune", season: "rabi" }, "wheat");
  assert.strictEqual(userReg.applicability.regionSource, "user");
  assert.strictEqual(userReg.applicability.region, "Pune");

  const defReg = expertSystem.recommend({ ph: 7.0, season: "rabi" }, "wheat");
  assert.strictEqual(defReg.applicability.regionSource, "default");
  assert.strictEqual(defReg.applicability.region, "Maharashtra");
  console.log("✓ TEST 10 Passed: Region source accurately flagged as 'user' or 'default'.");

  // 11. Ensure NO naive soil-minus-baseline fertilizer calculation exists
  console.log("Running TEST 11: Ensure No Naive Soil Subtraction Formula...");
  const subCheck = expertSystem.recommend({ ph: 7.0, nitrogen: 50, phosphorus: 10, potassium: 20, season: "rabi" }, "wheat");
  assert.strictEqual(subCheck.nutrientRequirement.n_kg_ha, 120); // 120 kg/ha baseline, NOT 120 - 50 = 70
  assert.strictEqual(subCheck.recommendationBasis.personalizedDoseCalculated, false);
  console.log("✓ TEST 11 Passed: Baseline N=120 returned as official baseline (no naive subtraction 120 - 50 = 70).");

  // 12. RecommendationEngine E2E Response format
  console.log("Running TEST 12: RecommendationEngine E2E Response Wording...");
  const e2eRes = recommendationEngine.generateRecommendations({ ph: 6.8, nitrogen: 100, season: "rabi" }, "wheat", "en", 100);
  assert.strictEqual(e2eRes.success, true);
  assert.strictEqual(e2eRes.data.recommendations[0].product, "Official MPKV Nutrient Requirement");
  assert.strictEqual(e2eRes.data.recommendationBasis.type, "official_baseline_plus_soil_assessment");
  console.log("✓ TEST 12 Passed: Product wording is 'Official MPKV Nutrient Requirement'.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
