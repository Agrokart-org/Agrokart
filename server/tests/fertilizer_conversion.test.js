/**
 * AgroKart Server - Dedicated Fertilizer Conversion Test Suite
 */

const assert = require("assert");
const fertilizerConversionService = require("../services/FertilizerConversionService");

function runTests() {
  console.log("\n=======================================================");
  console.log("TEST: Fertilizer Conversion Service Hardening");
  console.log("=======================================================\n");

  // Test 1: 46 kg N using Urea => 100 kg/ha Urea
  console.log("Running Test 1: 46 kg N using Urea...");
  const res1 = fertilizerConversionService.convertNutrientToProduct("N", 46, "urea");
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.productQuantityKgHa, 100);
  assert.strictEqual(res1.isMathematicalConversion, true);
  console.log("✓ Test 1 Passed: 46 kg N = 100 kg/ha Urea.");

  // Test 2: 46 kg P2O5 using DAP => 100 kg/ha DAP
  console.log("Running Test 2: 46 kg P2O5 using DAP...");
  const res2 = fertilizerConversionService.convertNutrientToProduct("P2O5", 46, "dap");
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.productQuantityKgHa, 100);
  assert.strictEqual(res2.isMathematicalConversion, true);
  console.log("✓ Test 2 Passed: 46 kg P2O5 = 100 kg/ha DAP.");

  // Test 3: 60 kg K2O using MOP => 100 kg/ha MOP
  console.log("Running Test 3: 60 kg K2O using MOP...");
  const res3 = fertilizerConversionService.convertNutrientToProduct("K2O", 60, "mop");
  assert.strictEqual(res3.success, true);
  assert.strictEqual(res3.productQuantityKgHa, 100);
  assert.strictEqual(res3.isMathematicalConversion, true);
  console.log("✓ Test 3 Passed: 60 kg K2O = 100 kg/ha MOP.");

  // Test 4: 60 kg P2O5 using DAP => ~130.4 kg/ha DAP
  console.log("Running Test 4: 60 kg P2O5 using DAP...");
  const res4 = fertilizerConversionService.convertNutrientToProduct("P2O5", 60, "dap");
  assert.strictEqual(res4.success, true);
  assert.strictEqual(res4.productQuantityKgHa, 130.4);
  assert.strictEqual(res4.isMathematicalConversion, true);
  console.log("✓ Test 4 Passed: 60 kg P2O5 = 130.4 kg/ha DAP.");

  // Test 5: DAP nitrogen accounting (N=120, P2O5=60, K2O=40)
  console.log("Running Test 5: DAP Nitrogen Accounting...");
  const npkRes = fertilizerConversionService.convertNPKToStandardFertilizers(120, 60, 40);
  assert.strictEqual(npkRes.success, true);
  assert.strictEqual(npkRes.dap_kg_ha, 130.4); // 60 / 0.46 = 130.4
  // N from DAP = 130.4 * 0.18 = 23.472 kg N
  // Remaining N = 120 - 23.472 = 96.528 kg N
  // Urea = 96.528 / 0.46 = 209.843... => 209.8 kg/ha Urea
  assert.strictEqual(npkRes.urea_kg_ha, 209.8);
  assert.strictEqual(npkRes.mop_kg_ha, 66.7); // 40 / 0.60 = 66.7
  assert.strictEqual(npkRes.basis.type, "mathematical_fertilizer_conversion");
  console.log("✓ Test 5 Passed: DAP N accounting verified (DAP: 130.4 kg, Urea: 209.8 kg, MOP: 66.7 kg).");

  // Test 6: Invalid fertilizer key
  console.log("Running Test 6: Invalid fertilizer key...");
  const invalidKeyRes = fertilizerConversionService.convertNutrientToProduct("N", 46, "unknown_product");
  assert.strictEqual(invalidKeyRes.success, false);
  assert.strictEqual(typeof invalidKeyRes.error, "string");
  console.log("✓ Test 6 Passed: Invalid fertilizer key rejected.");

  // Test 7: Unsupported nutrient
  console.log("Running Test 7: Unsupported nutrient...");
  const unsuppNutRes = fertilizerConversionService.convertNutrientToProduct("Ca", 46, "urea");
  assert.strictEqual(unsuppNutRes.success, false);
  assert.strictEqual(typeof unsuppNutRes.error, "string");
  console.log("✓ Test 7 Passed: Unsupported nutrient rejected.");

  // Test 8: Negative nutrient requirement
  console.log("Running Test 8: Negative nutrient requirement...");
  const negNutRes = fertilizerConversionService.convertNutrientToProduct("N", -46, "urea");
  assert.strictEqual(negNutRes.success, false);
  assert.strictEqual(typeof negNutRes.error, "string");

  const negNPKRes = fertilizerConversionService.convertNPKToStandardFertilizers(-120, 60, 40);
  assert.strictEqual(negNPKRes.success, false);
  assert.strictEqual(typeof negNPKRes.error, "string");
  console.log("✓ Test 8 Passed: Negative nutrient requirements rejected.");

  // Test 9: Zero nutrient requirement
  console.log("Running Test 9: Zero nutrient requirement...");
  const zeroNutRes = fertilizerConversionService.convertNutrientToProduct("N", 0, "urea");
  assert.strictEqual(zeroNutRes.success, true);
  assert.strictEqual(zeroNutRes.productQuantityKgHa, 0);
  assert.strictEqual(zeroNutRes.isMathematicalConversion, true);

  const zeroNPKRes = fertilizerConversionService.convertNPKToStandardFertilizers(0, 0, 0);
  assert.strictEqual(zeroNPKRes.success, true);
  assert.strictEqual(zeroNPKRes.urea_kg_ha, 0);
  assert.strictEqual(zeroNPKRes.dap_kg_ha, 0);
  assert.strictEqual(zeroNPKRes.mop_kg_ha, 0);
  console.log("✓ Test 9 Passed: Zero nutrient requirement handled without crashing.");

  // Test 10: Verify every successful conversion has isMathematicalConversion === true
  console.log("Running Test 10: isMathematicalConversion flag verification...");
  const singleConv = fertilizerConversionService.convertNutrientToProduct("N", 46, "urea");
  assert.strictEqual(singleConv.isMathematicalConversion, true);

  const comboConv = fertilizerConversionService.convertNPKToStandardFertilizers(120, 60, 40);
  assert.strictEqual(comboConv.success, true);
  assert.ok(comboConv.conversions.length > 0);
  for (const item of comboConv.conversions) {
    assert.strictEqual(item.isMathematicalConversion, true);
    assert.ok(typeof item.note === "string" && item.note.length > 0);
  }
  console.log("✓ Test 10 Passed: All successful conversions explicitly marked with isMathematicalConversion === true.");

  console.log("\n🎉 ALL FERTILIZER CONVERSION TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
