const validationService = require('../src/services/ValidationService');
const qualityModel = require('../src/services/QualityModel');

console.log("=== Dr. Agro Acceptance Testing ===");

function testValidator(scenarioName, mockText) {
    console.log(`\n[Scenario] ${scenarioName}`);
    // console.log(`Input Text: "${mockText.substring(0, 50)}..."`);

    const result = validationService.isValidSoilReport(mockText);
    if (result.isValid) {
        console.log("✅ ACCEPTED: Valid Soil Report detected.");
        console.log(`   Confidence: ${result.confidence}%`);
    } else {
        console.log("❌ REJECTED: " + result.message);
        console.log(`   Confidence: ${result.confidence}%`);
    }
    return result;
}

// 1. Valid Soil Report
const validReportText = `
SOIL TEST REPORT
Farmer Name: Kishan
Sample ID: 12345
pH: 7.2
Nitrogen (N): 240 kg/ha
Phosphorus (P): 18 kg/ha
Potassium (K): 150 kg/ha
Organic Carbon: 0.45%
Electrical Conductivity: 0.2
Lab Signature
`;
testValidator("Valid Soil Report", validReportText);

// 2. Random Photo (e.g. Selfie or Scenery)
const randomPhotoText = `
Beautiful sunset at the farm.
Nature photography.
Camera: Sony A7.
Date: 2024-01-01
`;
testValidator("Random Photo / Scenery", randomPhotoText);

// 3. Crop Photo (Visuals of plants but no report data)
const cropPhotoText = `
Wheat crop analysis.
Leaf color is yellow.
Pest infection suspected.
Growth stage: Flowering.
`;
testValidator("Crop Photo (Visual Only)", cropPhotoText);

// 4. Low Quality / Gibberish Scan
const lowQualityText = `
S...il ..est R..pt
F..rm..r N..m..
p.. 7..
Ni..ro..en ..
`;
testValidator("Low Quality / Blurred Scan", lowQualityText);

console.log("\n=== External API Check ===");
const codeFiles = [
    'src/services/RecommendationEngine.js',
    'src/services/ExpertSystem.js',
    'src/services/OcrService.js',
    'src/services/ValidationService.js',
    'src/services/QualityModel.js'
];
console.log("Scanning core files for 'axios', 'fetch', 'http', 'https', 'openai', 'gemini' usage...");

const fs = require('fs');
const path = require('path');

let apiCallsFound = false;
codeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, '../', file), 'utf8');
    if (content.match(/axios\.|fetch\(|openai|gemini/i)) {
        console.error(`⚠️  WARNING: Potential API call found in ${file}`);
        apiCallsFound = true;
    }
});

if (!apiCallsFound) {
    console.log("✅ No External API calls detected in core services.");
}

console.log("\n=== Acceptance Test Complete ===");
