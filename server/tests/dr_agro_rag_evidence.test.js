/**
 * AgroKart Server - Dr. Agro RAG Supporting Evidence Test Suite
 */

const assert = require("assert");
const recommendationEngine = require("../services/RecommendationEngine");

async function runTests() {
  console.log("\n=======================================================");
  console.log("TEST: Dr. Agro RAG Supporting Evidence Layer");
  console.log("=======================================================\n");

  // 1. Wheat Evidence Retrieval Test
  console.log("Running Test 1: Wheat RAG Supporting Evidence...");
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

  // Verify Evidence Object Structure
  assert.ok(wData.evidence !== undefined && wData.evidence !== null);
  assert.strictEqual(wData.evidence.available, true);
  assert.strictEqual(wData.evidence.retrievalType, "official_document");

  // Verify Provenance
  assert.strictEqual(wData.evidence.source.organization, "MPKV");
  assert.strictEqual(wData.evidence.source.document, "MPKV_Wheat.pdf");
  assert.strictEqual(wData.evidence.source.page, 2);
  assert.ok(typeof wData.evidence.supportingText === "string" && wData.evidence.supportingText.length > 0);

  console.log("✓ Test 1 Passed: Wheat evidence retrieved from MPKV_Wheat.pdf (p. 2) with valid provenance.");

  // 2. Sugarcane Evidence Retrieval Test
  console.log("\nRunning Test 2: Sugarcane RAG Supporting Evidence...");
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

  assert.strictEqual(scData.evidence.available, true);
  assert.strictEqual(scData.evidence.source.organization, "MPKV");
  assert.strictEqual(scData.evidence.source.document, "MPKV_Sugarcane.pdf");
  assert.strictEqual(scData.evidence.source.page, 6);
  assert.ok(scData.evidence.supportingText.includes("sugarcane"));

  console.log("✓ Test 2 Passed: Sugarcane evidence retrieved from MPKV_Sugarcane.pdf (p. 6).");

  // 3. Unknown Crop Evidence Test
  console.log("\nRunning Test 3: Unknown Crop Evidence Handling...");
  const unknownInput = { crop: "dragonfruit_unknown", ph: 6.5 };
  const unknownRes = await recommendationEngine.processManualData(unknownInput, unknownInput.crop, "en");

  assert.strictEqual(unknownRes.success, false);
  assert.strictEqual(unknownRes.insufficientData, true);
  assert.strictEqual(unknownRes.data.evidence.available, false);
  assert.strictEqual(unknownRes.data.evidence.source, null);
  assert.strictEqual(unknownRes.data.evidence.supportingText, null);

  console.log("✓ Test 3 Passed: Unknown crop explicitly returned evidence.available === false without fabrication.");

  // 4. Missing Evidence Handling Test
  console.log("\nRunning Test 4: Missing Evidence Handling...");
  const missingEv = recommendationEngine.buildEvidence(null);
  assert.strictEqual(missingEv.available, false);
  assert.strictEqual(missingEv.source, null);
  assert.strictEqual(missingEv.supportingText, null);
  assert.strictEqual(missingEv.retrievalType, null);

  console.log("✓ Test 4 Passed: Missing/null recommendation returns available === false.");

  // 5. Provenance Requirements Test
  console.log("\nRunning Test 5: Evidence Provenance Field Verification...");
  const fakeExpertResult = {
    success: true,
    source: { organization: "MPKV", document: "MPKV_Paddy.pdf", page: 4 },
    applicability: { crop: "paddy", region: "Maharashtra", season: "kharif" },
    nutrientRequirement: { n_kg_ha: 100, p2o5_kg_ha: 50, k2o_kg_ha: 50 }
  };

  const evResult = recommendationEngine.buildEvidence(fakeExpertResult);
  assert.strictEqual(evResult.available, true);
  assert.strictEqual(evResult.source.organization, "MPKV");
  assert.strictEqual(evResult.source.document, "MPKV_Paddy.pdf");
  assert.strictEqual(evResult.source.page, 4);
  assert.ok(evResult.supportingText.includes("MPKV_Paddy.pdf"));

  console.log("✓ Test 5 Passed: Evidence provenance contains organization, document, page, and supportingText.");

  console.log("\n🎉 ALL DR. AGRO RAG EVIDENCE TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
