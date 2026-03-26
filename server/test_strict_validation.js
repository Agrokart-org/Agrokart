
const aiService = require('./src/services/aiService');

// Mock Text Samples
const samples = {
    validReport: `
        Laboratory Soil Test Report
        Sample ID: 12345
        Farmer Name: John Doe
        
        Parameter       Results       Unit
        pH              7.5           -
        Nitrogen        140           kg/ha
        Phosphorus      35            kg/ha
        Potassium       200           kg/ha
        Organic Carbon  0.6           %
        Zinc            0.5           ppm
    `,

    technicalButInvalid: `
        Invoice #9999
        Item: Nitrogen Booster
        Price: 500
        pH Balancer: 200
        Total: 700
    `,

    randomText: `
        The quick brown fox jumps over the lazy dog.
        Agriculture is important for the economy.
        Farmers grow crops like wheat and rice.
    `,

    borderline: `
        Soil Inspection
        We looked at the land. It seems okay.
        The nitrogen levels look decent.
        Phosphorus is there.
    `
};

console.log("=== Testing Dr.Agro Strict Validation ===\n");

Object.entries(samples).forEach(([name, text]) => {
    console.log(`--- Testing: ${name} ---`);
    const result = aiService.validateSoilReport(text);
    console.log(`Result: ${result.isValid ? 'PASS' : 'FAIL'}`);
    console.log(`Confidence: ${result.confidence}%`);
    if (!result.isValid) console.log(`Reason: ${result.reason}`);
    console.log('\n');
});
