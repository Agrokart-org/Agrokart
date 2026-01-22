
const aiService = require('./src/services/aiService');

const textInvalid = `
Invoice #9999
Item: Nitrogen Booster
Price: 500
pH Balancer: 200
Total: 700
`;

console.log("\n=== DEBUGGING INVALID CASE ===");
const result = aiService.validateSoilReport(textInvalid);
console.log("Final Result:", JSON.stringify(result, null, 2));

const textRandom = `
The quick brown fox jumps over the lazy dog.
Agriculture is important.
`;
console.log("\n=== DEBUGGING RANDOM CASE ===");
const result2 = aiService.validateSoilReport(textRandom);
console.log("Final Result:", JSON.stringify(result2, null, 2));
