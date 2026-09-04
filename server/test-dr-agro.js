const assert = require("assert");
const recommendationEngine = require("./services/RecommendationEngine");

async function testDrAgro() {
  console.log("=======================================================");
  console.log("Testing Dr. Agro E2E Recommendation Engine Contract...");
  console.log("=======================================================\n");

  // Test Case 1: Wheat (English)
  const payload1 = {
    crop: "wheat",
    ph: 6.5,
    nitrogen: 120,
    phosphorus: 40,
    potassium: 200,
    region: "Maharashtra",
    season: "rabi",
    language: "en"
  };

  console.log("--- Request 1: English / Wheat ---");
  const res1 = await recommendationEngine.processManualData(payload1, payload1.crop, payload1.language);

  console.log("Full Data Object (Wheat):");
  console.log(JSON.stringify(res1, null, 2));

  // Assertions for Wheat / English
  assert.strictEqual(res1.success, true, "Wheat request must return success === true");
  const d1 = res1.data;
  assert.strictEqual(d1.overallConfidence, 100, "overallConfidence must be 100");
  assert.strictEqual(typeof d1.soilHealth, "string", "soilHealth string must exist");
  assert.strictEqual(d1.recommendation_type, "official_baseline_nutrient_requirement", "recommendation_type must be official_baseline_nutrient_requirement");

  assert.strictEqual(typeof d1.recommendationBasis, "object", "recommendationBasis must exist");
  assert.strictEqual(d1.recommendationBasis.officialSource, true, "officialSource must be true");
  assert.strictEqual(d1.recommendationBasis.personalizedDoseCalculated, false, "personalizedDoseCalculated must be false");

  assert.strictEqual(typeof d1.nutrientRequirement, "object", "nutrientRequirement must exist");
  assert.strictEqual(typeof d1.nutrientRequirement.n_kg_ha, "number", "n_kg_ha must be a number");
  assert.strictEqual(typeof d1.nutrientRequirement.p2o5_kg_ha, "number", "p2o5_kg_ha must be a number");
  assert.strictEqual(typeof d1.nutrientRequirement.k2o_kg_ha, "number", "k2o_kg_ha must be a number");

  assert.strictEqual(typeof d1.soilAssessment, "object", "soilAssessment must exist");
  assert.strictEqual(typeof d1.soilAssessment.nitrogen, "object", "soilAssessment.nitrogen must exist");
  assert.strictEqual(typeof d1.soilAssessment.phosphorus, "object", "soilAssessment.phosphorus must exist");
  assert.strictEqual(typeof d1.soilAssessment.potassium, "object", "soilAssessment.potassium must exist");
  assert.strictEqual(typeof d1.soilAssessment.ph, "object", "soilAssessment.ph must exist");

  assert.strictEqual(typeof d1.source, "object", "source must exist");
  assert.strictEqual(d1.source.organization, "MPKV", "source organization must be MPKV");
  assert.strictEqual(typeof d1.source.document, "string", "source document must be a string");
  assert.strictEqual(typeof d1.source.page, "number", "source page must be a number");
  assert.strictEqual(typeof d1.source.year, "number", "source year must be a number");

  assert.strictEqual(Array.isArray(d1.recommendations), true, "recommendations must be an array");
  assert.strictEqual(d1.recommendations[0].product, "Official MPKV Nutrient Requirement", "product name must be Official MPKV Nutrient Requirement");
  assert.strictEqual(d1.recommendationBasis.personalizedDoseCalculated, false, "Must not claim baseline is personalized dose");

  console.log("\n✓ All 13 assertions passed for Wheat / English!\n");

  // Test Case 2: Sugarcane (Hindi / Suru Season)
  const payload2 = {
    crop: "sugarcane",
    ph: 7.2,
    nitrogen: 200,
    phosphorus: 60,
    potassium: 100,
    region: "Maharashtra",
    season: "suru",
    language: "hi"
  };

  console.log("--- Request 2: Hindi / Sugarcane ---");
  const res2 = await recommendationEngine.processManualData(payload2, payload2.crop, payload2.language);

  console.log("Full Data Object (Sugarcane):");
  console.log(JSON.stringify(res2, null, 2));

  // Assertions for Sugarcane / Hindi
  assert.strictEqual(res2.success, true, "Sugarcane request must return success === true");
  const d2 = res2.data;
  assert.strictEqual(d2.source.document, "MPKV_Sugarcane.pdf", "source document must be MPKV_Sugarcane.pdf");
  assert.strictEqual(d2.nutrientRequirement.n_kg_ha, 250, "n_kg_ha for suru sugarcane must be 250");
  assert.strictEqual(d2.nutrientRequirement.p2o5_kg_ha, 115, "p2o5_kg_ha for suru sugarcane must be 115");
  assert.strictEqual(d2.nutrientRequirement.k2o_kg_ha, 115, "k2o_kg_ha for suru sugarcane must be 115");
  assert.strictEqual(typeof d2.soilAssessment, "object", "soilAssessment must exist for sugarcane");

  console.log("\n✓ All assertions passed for Sugarcane / Hindi!\n");
  console.log("🎉 DR AGRO E2E CONTRACT TEST PASSED SUCCESSFULLY!\n");
}

testDrAgro();
