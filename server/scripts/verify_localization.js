const recommendationEngine = require('../src/services/RecommendationEngine');

async function verifyLocalization() {
    console.log("=== Dr. Agro Localization Verification ===");

    const soilData = { ph: 7.2, nitrogen: 210, phosphorus: 30, potassium: 200, organic_carbon: 0.5 };

    // Test Hindi
    console.log("\n[Test 1] Hindi Analysis (Wheat)");
    const resHi = await recommendationEngine.processManualData(soilData, 'wheat', 'hi');
    const recHi = resHi.data.recommendations[0]; // Urea

    console.log("Product (Hi):", recHi.product);
    console.log("Reason (Hi):", recHi.reason);

    if (recHi.product.includes('यूरिया')) {
        console.log("✅ Hindi Fertilizer Name Correct.");
    } else {
        console.error("❌ Hindi Fertilizer Name Failed:", recHi.product);
    }

    if (recHi.reason.includes('नाइट्रोजन')) {
        console.log("✅ Hindi Reason contains correct Nutrient.");
    }

    // Test Marathi
    console.log("\n[Test 2] Marathi Analysis (Wheat)");
    const resMr = await recommendationEngine.processManualData(soilData, 'wheat', 'mr');
    const recMr = resMr.data.recommendations[0]; // Urea

    console.log("Product (Mr):", recMr.product);
    console.log("Reason (Mr):", recMr.reason);

    if (recMr.product.includes('युरिया')) {
        console.log("✅ Marathi Fertilizer Name Correct.");
    } else {
        console.error("❌ Marathi Fertilizer Name Failed:", recMr.product);
    }

    if (recMr.reason.includes('नायट्रोजन')) {
        console.log("✅ Marathi Reason contains correct Nutrient.");
    }

    console.log("\n=== verification complete ===");
}

verifyLocalization();
