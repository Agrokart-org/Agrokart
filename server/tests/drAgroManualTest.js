const aiService = require('../src/services/aiService');

async function testManualAnalysis() {
    const soilData = {
        ph: 6.5,
        nitrogen: 150, // Low (Standard ~280)
        phosphorus: 15, // Medium
        potassium: 300, // High
        crop: 'Wheat'
    };

    const landDetails = { area: 1, unit: 'acre' };

    console.log("Testing Manual Analysis for:", soilData);

    try {
        const result = await aiService.generateRecommendations(soilData, landDetails, 'en');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testManualAnalysis();
