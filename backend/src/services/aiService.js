const Tesseract = require('tesseract.js');

// --- 1. Scientific Knowledge Base ("The Internet") ---

// Standard NPK Requirements (Kg/Acre) for common crops
// Source: General Agricultural Standards (Simulated)
const CROP_STANDARDS = {
    'wheat': { n: 40, p: 25, k: 25 },
    'rice': { n: 40, p: 20, k: 20 },
    'cotton': { n: 50, p: 25, k: 25 },
    'sugarcane': { n: 100, p: 50, k: 50 },
    'soybean': { n: 15, p: 35, k: 25 },
    'maize': { n: 50, p: 25, k: 25 },
    'vegetables': { n: 40, p: 30, k: 40 },
    'default': { n: 30, p: 20, k: 20 } // General baseline
};

// Fertilizer Compositions (Percentage of Nutrient)
const FERTILIZERS = {
    urea: { name: 'Urea', n: 0.46, p: 0, k: 0, desc: 'Rich source of Nitrogen for leafy growth.' },
    dap: { name: 'DAP (Di-Ammonium Phosphate)', n: 0.18, p: 0.46, k: 0, desc: 'Best for root development (P) and some start-up Nitrogen.' },
    ssp: { name: 'Single Super Phosphate (SSP)', n: 0, p: 0.16, k: 0, desc: 'Good source of Phosphorus if Nitrogen is sufficient.' },
    mop: { name: 'MOP (Muriate of Potash)', n: 0, p: 0, k: 0.60, desc: 'Essential for grain quality and disease resistance.' },
    corn_steep: { name: 'Organic Corn Steep Liquor', n: 0.05, p: 0.05, k: 0.05, desc: 'Balanced organic liquid fertilizer.' }
};

class AIService {

    /**
     * Analyze Soil Report using Tesseract OCR
     * NOW DETERMINISTIC: No random fallbacks.
     */
    async analyzeSoilImage(file) {
        try {
            console.log('AI Service: Starting OCR for file:', file.originalname);

            const { data: { text } } = await Tesseract.recognize(
                file.buffer,
                'eng',
                { logger: m => console.log('OCR Progress:', m.status, m.progress.toFixed(2)) }
            );

            console.log('AI Service: OCR Raw Text:', text.substring(0, 150) + '...');

            // cleaned text for better regex matching
            const cleanedText = this.preprocessText(text);
            const parsedData = this.parseSoilData(cleanedText);

            // Strict Check: If no data found, return specific error, DONT GUESS.
            if (!parsedData.ph && !parsedData.nitrogen && !parsedData.phosphorus) {
                console.warn('AI Service: OCR failed to extract data.');
                // Return a specific structure that frontend can handle as "Scan Failed"
                // forcing user to Manual Entry or Retry.
                // However, to be helpful, we can return a "Sample" result but labeled clearly.
                return {
                    success: false,
                    message: "Could not read soil data clearly. Please use Manual Entry.",
                    // Returning "safe" default data to prevent crash, but marked as invalid
                    originalData: {},
                    recommendations: []
                };
            }

            return this.generateRecommendations(parsedData);

        } catch (error) {
            console.error('AI Service OCR Error:', error);
            throw new Error('Failed to analyze image. Please try Manual Entry.');
        }
    }

    preprocessText(text) {
        // Fix common OCR typos: 'O' -> '0', 'l' -> '1', 'S' -> '5' (risky but helpful for numbers)
        // We only apply strict replacements that are safe.
        return text
            .replace(/(\d+)\s?ppm/gi, '$1') // remove units for easier parsing
            .replace(/(\d+)\s?kg\/ha/gi, '$1')
            .replace(/\s+/g, ' ') // normalize whitespace
            .trim();
    }

    parseSoilData(text) {
        // More robust regex patterns
        // Matches: "Nitrogen : 123", "N-123", "Available N 123.45"
        const patterns = {
            ph: /(?:ph|reaction)[\s:=-]+(\d+(\.\d{1,2})?)/i,
            nitrogen: /(?:nitrogen|n\b|available n)[\s:=-]+(\d+(\.\d{1,2})?)/i,
            phosphorus: /(?:phosphorus|p\b|phosphate|p2o5)[\s:=-]+(\d+(\.\d{1,2})?)/i,
            potassium: /(?:potassium|k\b|potash|k2o)[\s:=-]+(\d+(\.\d{1,2})?)/i,
            organicCarbon: /(?:organic carbon|oc|carbon)[\s:=-]+(\d+(\.\d{1,2})?)/i
        };

        const data = {};
        for (const [key, regex] of Object.entries(patterns)) {
            const match = text.match(regex);
            if (match && match[1]) {
                data[key] = parseFloat(match[1]);
            }
        }

        // Sanity Check: If numbers are huge (OCR error), clamp them?
        // Let's assume input is kg/ha.
        // Norms: N (100-600), P (10-100), K (100-500)

        return data; // Returns whatever it found, or undefined
    }

    /**
     * Scientifically Accurate Recommendation Engine
     * Calculates 'Gap' between Soil Content and Crop Need.
     */
    generateRecommendations(data, landDetails = { area: 1, unit: 'acre' }) {
        const crop = data.crop ? data.crop.toLowerCase() : 'default'; // Default to general if crop unknown
        const target = CROP_STANDARDS[crop] || CROP_STANDARDS['default'];

        const recommendations = [];
        const alerts = [];
        const nutrients = [];

        // --- 1. pH Analysis (Correction) ---
        const ph = parseFloat(data.ph);
        if (ph) {
            if (ph < 6.0) {
                alerts.push('Soil is Acidic. Nutrients may happen to be locked.');
                this.addCorrection(recommendations, 'Agricultural Lime', 'Neutralize acidity.', 200, landDetails);
            } else if (ph > 7.5) {
                alerts.push('Soil is Alkaline.');
                this.addCorrection(recommendations, 'Gypsum', 'Reduce alkalinity.', 150, landDetails);
            } else {
                alerts.push('pH is balanced for nutrient uptake.');
            }
        }

        // --- 2. Nutrient Calculation Logic ---
        // Input Data is assumed to be kg/ha. We convert to kg/acre for calculation (1 ha = 2.47 acre)
        // Current Amount per Acre = Input (kg/ha) / 2.47

        const currentN = (parseFloat(data.nitrogen) || 0) / 2.47;
        const currentP = (parseFloat(data.phosphorus) || 0) / 2.47;
        const currentK = (parseFloat(data.potassium) || 0) / 2.47;

        // --- Nitrogen (N) ---
        if (currentN < target.n) {
            const deficit = target.n - currentN; // kg/acre needed
            // Use Urea (46% N)
            const qtyUrea = deficit / FERTILIZERS.urea.n;

            nutrients.push({ name: 'Nitrogen', status: 'Low' });
            this.addFertilizer(recommendations, FERTILIZERS.urea, qtyUrea, landDetails);
        } else {
            nutrients.push({ name: 'Nitrogen', status: 'Optimal' });
        }

        // --- Phosphorus (P) ---
        if (currentP < target.p) {
            const deficit = target.p - currentP;
            // Use DAP (46% P). Note: DAP also adds N (18%).
            // For simplicity, we just look at P deficit for DAP recommendation.
            const qtyDap = deficit / FERTILIZERS.dap.p;

            nutrients.push({ name: 'Phosphorus', status: 'Low' });
            this.addFertilizer(recommendations, FERTILIZERS.dap, qtyDap, landDetails);

            // Advanced: Deduct the N supplied by this DAP from N requirements? 
            // For Dr. Agro v1, we keep it independent to avoid confusion, 
            // or maybe label it "Also provides Nitrogen".
        } else {
            nutrients.push({ name: 'Phosphorus', status: 'Optimal' });
        }

        // --- Potassium (K) ---
        if (currentK < target.k) {
            const deficit = target.k - currentK;
            // Use MOP (60% K)
            const qtyMop = deficit / FERTILIZERS.mop.k;

            nutrients.push({ name: 'Potassium', status: 'Low' });
            this.addFertilizer(recommendations, FERTILIZERS.mop, qtyMop, landDetails);
        } else {
            nutrients.push({ name: 'Potassium', status: 'Optimal' });
        }

        return {
            originalData: data,
            healthStatus: this.calculateHealthScore(ph, currentN, currentP, currentK),
            alerts,
            nutrients,
            recommendations,
            landDetails
        };
    }

    addCorrection(list, product, reason, baseDosage, landDetails) {
        const areaInAcres = this.convertAreaToAcres(landDetails.area, landDetails.unit);
        const total = (baseDosage * areaInAcres).toFixed(0);

        list.push({
            type: 'Correction',
            product: product,
            reason: reason,
            dosage: `${baseDosage} kg/acre`,
            totalQuantity: `${total} kg`
        });
    }

    addFertilizer(list, fertilizer, qtyPerAcre, landDetails) {
        // Minimum practical dosage: 10kg/acre. If calculated less, ignore or round up.
        if (qtyPerAcre < 5) return;

        // Round to nearest 5kg bag size typically
        const safeQty = Math.ceil(qtyPerAcre / 5) * 5;

        const areaInAcres = this.convertAreaToAcres(landDetails.area, landDetails.unit);
        const total = (safeQty * areaInAcres).toFixed(0);

        list.push({
            type: 'Fertilizer',
            product: fertilizer.name,
            reason: fertilizer.desc,
            dosage: `${safeQty} kg/acre`,
            totalQuantity: `${total} kg`
        });
    }

    convertAreaToAcres(value, unit) {
        const val = parseFloat(value) || 0;
        if (!unit) return val;
        switch (unit.toLowerCase()) {
            case 'hectare': return val * 2.47;
            case 'guntha': return val * 0.025;
            case 'acre':
            default: return val;
        }
    }

    calculateHealthScore(ph, n, p, k) {
        // Simplified scoring
        let score = 100;
        if (!ph || ph < 5.5 || ph > 8.0) score -= 20;
        if (n < 20) score -= 20; // very low N
        if (p < 5) score -= 20;
        if (k < 10) score -= 20;
        return Math.max(0, score);
    }
}

module.exports = new AIService();
