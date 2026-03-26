
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Ordered by preference: lighter/cheaper first
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-1.0-pro-vision-latest", // older fallback
        "gemini-pro-vision" // legacy
    ];

    console.log("Testing model availability...");

    for (const modelName of candidates) {
        process.stdout.write(`Testing: ${modelName} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`✅ SUCCESS`);
            console.log(`\n!!! USE THIS MODEL: ${modelName} !!!\n`);
            return;
        } catch (error) {
            console.log(`❌ FAILED`);
            // console.log(`Error: ${error.message}`); 
        }
    }
    console.log("\nNo working models found.");
}

listModels();
