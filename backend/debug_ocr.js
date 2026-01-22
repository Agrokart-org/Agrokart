const fs = require('fs');
const path = require('path');

const imagePath = 'C:/Users/ASUS/.gemini/antigravity/brain/3ac7957c-c58a-45b8-9e9d-6502ef607902/uploaded_image_1769099336207.png';
const outputPath = './debug_ocr_out.txt';

function log(msg) {
    try {
        fs.appendFileSync(outputPath, typeof msg === 'object' ? JSON.stringify(msg, null, 2) + '\n' : msg + '\n');
        console.log(msg);
    } catch (e) {
        console.error("Log failed", e);
    }
}

async function runDebug() {
    log("Starting Debug Script...");

    let Tesseract;
    try {
        log("Requiring Tesseract...");
        Tesseract = require('tesseract.js');
        log("Tesseract loaded.");
    } catch (e) {
        log("Failed to load Tesseract: " + e.message);
        return;
    }

    try {
        if (!fs.existsSync(imagePath)) {
            log("Image file not found at path: " + imagePath);
            return;
        }

        const imageBuffer = fs.readFileSync(imagePath);
        log(`Image loaded. Size: ${imageBuffer.length} bytes`);

        log("Starting OCR...");
        const { data: { text } } = await Tesseract.recognize(
            imageBuffer,
            'eng',
            { logger: m => log(`OCR Status: ${m.status} - ${(m.progress * 100).toFixed(0)}%`) }
        );

        log("\n--- OCR OUTPUT START ---");
        log(text);
        log("--- OCR OUTPUT END ---\n");

        log("Finished.");

    } catch (error) {
        log("Runtime Error: " + error.toString());
    }
}

// Clear previous log
try {
    fs.writeFileSync(outputPath, "Init...\n");
    runDebug();
} catch (e) {
    console.error("Init failed", e);
}
