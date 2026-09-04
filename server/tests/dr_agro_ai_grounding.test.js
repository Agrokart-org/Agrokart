/**
 * AgroKart Server - Dr. Agro AI Grounding & Explanation Test Suite
 */

const assert = require("assert");
const recommendationEngine = require("../services/RecommendationEngine");
const aiService = require("../services/aiService");

async function runTests() {
  console.log("\n=======================================================");
  console.log("TEST: Dr. Agro Verified AI Explanation Layer");
  console.log("=======================================================\n");

  // 1. Valid Wheat Explanation (English)
  console.log("Running Test 1: Valid Wheat Explanation (English)...");
  const wheatRes = await recommendationEngine.processManualData(
    { ph: 6.5, nitrogen: 120, phosphorus: 40, potassium: 200, region: "Maharashtra", season: "rabi" },
    "wheat",
    "en"
  );
  assert.strictEqual(wheatRes.success, true);
  const wData = wheatRes.data;

  assert.ok(wData.aiExplanation !== undefined && wData.aiExplanation !== null);
  assert.strictEqual(wData.aiExplanation.available, true);
  assert.strictEqual(wData.aiExplanation.language, "en");
  assert.ok(wData.aiExplanation.officialRecommendation.includes("120:60:40 N:P2O5:K2O kg/ha"));
  assert.ok(wData.aiExplanation.fertilizerExplanation.includes("mathematical conversions"));
  assert.ok(wData.aiExplanation.evidenceExplanation.includes("MPKV_Wheat.pdf"));
  assert.strictEqual(wData.aiExplanation.sources[0], "MPKV — MPKV_Wheat.pdf (p. 2)");

  console.log("✓ Test 1 Passed: English Wheat explanation correctly generated and grounded.");

  // 2. Valid Sugarcane Explanation (English)
  console.log("\nRunning Test 2: Valid Sugarcane Explanation (English)...");
  const sugarcaneRes = await recommendationEngine.processManualData(
    { ph: 7.2, nitrogen: 200, phosphorus: 60, potassium: 100, region: "Maharashtra", season: "suru" },
    "sugarcane",
    "en"
  );
  assert.strictEqual(sugarcaneRes.success, true);
  const scData = sugarcaneRes.data;

  assert.strictEqual(scData.aiExplanation.available, true);
  assert.ok(scData.aiExplanation.officialRecommendation.includes("250:115:115 N:P2O5:K2O kg/ha"));
  assert.strictEqual(scData.aiExplanation.sources[0], "MPKV — MPKV_Sugarcane.pdf (p. 6)");

  console.log("✓ Test 2 Passed: English Sugarcane explanation generated with 250:115:115 target.");

  // 3. Hindi Explanation ('hi')
  console.log("\nRunning Test 3: Hindi Explanation ('hi')...");
  const hindiRes = await recommendationEngine.processManualData(
    { ph: 7.2, nitrogen: 200, phosphorus: 60, potassium: 100, region: "Maharashtra", season: "suru" },
    "sugarcane",
    "hi"
  );
  assert.strictEqual(hindiRes.success, true);
  const hiData = hindiRes.data;

  assert.strictEqual(hiData.aiExplanation.available, true);
  assert.strictEqual(hiData.aiExplanation.language, "hi");
  // Scientific values & doc names must remain identical
  assert.ok(hiData.aiExplanation.officialRecommendation.includes("250:115:115 N:P2O5:K2O kg/ha"));
  assert.ok(hiData.aiExplanation.evidenceExplanation.includes("MPKV_Sugarcane.pdf"));
  assert.ok(hiData.aiExplanation.fertilizerExplanation.includes("गणितीय"));

  console.log("✓ Test 3 Passed: Hindi explanation translated while keeping scientific numbers and doc names identical.");

  // 4. Marathi Explanation ('mr')
  console.log("\nRunning Test 4: Marathi Explanation ('mr')...");
  const marathiRes = await recommendationEngine.processManualData(
    { ph: 7.2, nitrogen: 200, phosphorus: 60, potassium: 100, region: "Maharashtra", season: "suru" },
    "sugarcane",
    "mr"
  );
  assert.strictEqual(marathiRes.success, true);
  const mrData = marathiRes.data;

  assert.strictEqual(mrData.aiExplanation.available, true);
  assert.strictEqual(mrData.aiExplanation.language, "mr");
  assert.ok(mrData.aiExplanation.officialRecommendation.includes("250:115:115 N:P2O5:K2O kg/ha"));
  assert.ok(mrData.aiExplanation.evidenceExplanation.includes("MPKV_Sugarcane.pdf"));
  assert.ok(mrData.aiExplanation.fertilizerExplanation.includes("गणितीय"));

  console.log("✓ Test 4 Passed: Marathi explanation translated while keeping scientific numbers and doc names identical.");

  // 5. Missing Evidence Handling
  console.log("\nRunning Test 5: Missing Evidence Handling...");
  const noEvidenceContext = {
    crop: "wheat",
    soilAssessment: { ph: { value: 6.5, status: "Neutral" } },
    officialRecommendation: { n_kg_ha: 120, p2o5_kg_ha: 60, k2o_kg_ha: 40 },
    evidence: { available: false, source: null, supportingText: null }
  };
  const noEvExpl = aiService.generateVerifiedExplanation(noEvidenceContext, "en");

  assert.strictEqual(noEvExpl.available, true);
  assert.strictEqual(noEvExpl.sources.length, 0);
  assert.ok(noEvExpl.evidenceExplanation.includes("No additional document evidence retrieved"));

  console.log("✓ Test 5 Passed: Missing evidence handled without fabricating sources.");

  // 6. Missing Soil Values
  console.log("\nRunning Test 6: Missing Soil Values Handling...");
  const missingKRes = await recommendationEngine.processManualData(
    { ph: 6.5, nitrogen: 120, phosphorus: 40, region: "Maharashtra", season: "rabi" },
    "wheat",
    "en"
  );
  assert.strictEqual(missingKRes.success, true);
  const mkData = missingKRes.data;
  assert.ok(mkData.aiExplanation.soilStatus.some(s => s.includes("Potassium (K): Unknown")));

  console.log("✓ Test 6 Passed: Missing soil value correctly noted as Unknown in soilStatus.");

  // 7. LLM Failure Resilient Handling
  console.log("\nRunning Test 7: LLM Failure Resilient Handling...");
  // Simulate AI service failure
  const originalMethod = aiService.generateVerifiedExplanation;
  aiService.generateVerifiedExplanation = function() {
    throw new Error("Simulated LLM API Timeout/Failure");
  };

  const failTestRes = await recommendationEngine.processManualData(
    { ph: 6.5, nitrogen: 120, phosphorus: 40, potassium: 200, region: "Maharashtra", season: "rabi" },
    "wheat",
    "en"
  );

  // Restore original method
  aiService.generateVerifiedExplanation = originalMethod;

  assert.strictEqual(failTestRes.success, true);
  assert.strictEqual(failTestRes.data.nutrientRequirement.n_kg_ha, 120);
  assert.strictEqual(failTestRes.data.fertilizerConversion.dap_kg_ha, 130.4);
  assert.strictEqual(failTestRes.data.aiExplanation.available, false);

  console.log("✓ Test 7 Passed: LLM failure handled safely without breaking official MPKV baseline or fertilizer conversion.");

  // 8. Invariant N/P/K Target Verification Across Languages
  console.log("\nRunning Test 8: Scientific Value Invariance...");
  assert.strictEqual(scData.nutrientRequirement.n_kg_ha, hiData.nutrientRequirement.n_kg_ha);
  assert.strictEqual(scData.nutrientRequirement.p2o5_kg_ha, mrData.nutrientRequirement.p2o5_kg_ha);

  console.log("✓ Test 8 Passed: Official N/P/K targets remain 100% invariant across all languages.");

  // 9. Explicit Conversion Labelling Verification
  console.log("\nRunning Test 9: Explicit Conversion Labelling Verification...");
  assert.ok(wData.aiExplanation.fertilizerExplanation.includes("mathematical conversions"));
  assert.ok(hiData.aiExplanation.fertilizerExplanation.includes("गणितीय"));

  console.log("✓ Test 9 Passed: Mathematical fertilizer calculations explicitly disclaimed across languages.");

  // 10. No Citation Fabrication Verification
  console.log("\nRunning Test 10: Citation Integrity...");
  assert.strictEqual(wData.aiExplanation.sources[0], "MPKV — MPKV_Wheat.pdf (p. 2)");
  assert.strictEqual(scData.aiExplanation.sources[0], "MPKV — MPKV_Sugarcane.pdf (p. 6)");

  console.log("✓ Test 10 Passed: Citations strictly match verified source documents.");

  console.log("\n🎉 ALL DR. AGRO AI GROUNDING TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
