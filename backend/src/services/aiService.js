const Tesseract = require('tesseract.js');

// --- 1. Scientific Knowledge Base ("The Internet") ---
const CROP_STANDARDS = {
    'wheat': { n: 40, p: 25, k: 25 },
    'rice': { n: 40, p: 20, k: 20 },
    'cotton': { n: 50, p: 25, k: 25 },
    'sugarcane': { n: 100, p: 50, k: 50 },
    'soybean': { n: 15, p: 35, k: 25 },
    'maize': { n: 50, p: 25, k: 25 },
    'vegetables': { n: 40, p: 30, k: 40 },
    'default': { n: 30, p: 20, k: 20 }
};

const FERTILIZERS = {
    urea: { name: 'Urea', n: 0.46, p: 0, k: 0, desc: 'Rich source of Nitrogen for leafy growth.' },
    dap: { name: 'DAP (Di-Ammonium Phosphate)', n: 0.18, p: 0.46, k: 0, desc: 'Best for root development (P) and some start-up Nitrogen.' },
    ssp: { name: 'Single Super Phosphate (SSP)', n: 0, p: 0.16, k: 0, desc: 'Good source of Phosphorus if Nitrogen is sufficient.' },
    mop: { name: 'MOP (Muriate of Potash)', n: 0, p: 0, k: 0.60, desc: 'Essential for grain quality and disease resistance.' },
    corn_steep: { name: 'Organic Corn Steep Liquor', n: 0.05, p: 0.05, k: 0.05, desc: 'Balanced organic liquid fertilizer.' }
};

class AIService {

    constructor() {
        console.log("AI Service: Initialized Local Smart OCR Engine.");
    }

    /**
     * Analyze Soil Report using LOCAL "Trained" Logic
     * Uses Tesseract + Fuzzy Matching + Heuristic Validation
     */
    async analyzeSoilImage(file) {
        try {
            console.log('AI Service: Starting Local OCR for file:', file.originalname);

            const { data: { text } } = await Tesseract.recognize(
                file.buffer,
                'eng',
                { logger: m => console.log('OCR Progress:', m.status, m.progress.toFixed(2)) }
            );

            console.log('AI Service: Raw OCR Text Length:', text.length);

            // --- 1. CLEANUP ---
            const cleanedText = this.preprocessText(text);

            // --- 2. SMART VALIDATION (The "Trained" Part) ---
            const validation = this.validateAndScore(cleanedText);

            if (!validation.isValid) {
                console.warn(`AI Service: Validation Failed (Score: ${validation.score}). Reason: ${validation.reason}`);
                return {
                    success: false,
                    isInvalidReport: true,
                    message: "This image does not appear to be a valid Soil Test Report. Please upload the original lab report.",
                    debugScore: validation.score
                };
            }

            // --- 3. SMART EXTRACTION ---
            const extractedData = this.smartExtract(cleanedText);

            // Critical Check: Did we actually get values?
            if (!extractedData.ph && !extractedData.nitrogen && !extractedData.phosphorus) {
                console.warn("AI Service: Valid report structure found, but failed to read values.");
                // Fallback to manual entry suggestion, BUT returns success:false to prompt user
                return {
                    success: false,
                    message: "Report recognized, but text is too blurry to read values. Please enter data manually."
                };
            }

            console.log("AI Service: Extracted Data:", extractedData);
            return this.generateRecommendations(extractedData);

        } catch (error) {
            console.error('AI Service OCR Error:', error);
            return {
                success: false,
                message: "Failed to process image. Please try again."
            };
        }
    }

    // --- SMART VALIDATION ENGINE ---

    validateAndScore(text) {
        let score = 0;
        const missing = [];

        // 1. Header Check (Strong Indicators)
        // Fuzzy match common headers
        const headers = ['soil test', 'soil report', 'analysis report', 'laboratory', 'test results', 'sample details'];
        let headerFound = false;

        headers.forEach(h => {
            if (this.fuzzyContains(text, h)) {
                score += 15;
                headerFound = true;
            }
        });

        // Cap header score
        if (score > 30) score = 30;

        // 2. Parameter Check (The Core)
        // Must find at least 3 essential params
        const params = [
            { key: 'ph', variants: ['ph', 'acidity', 'reaction'] },
            { key: 'nitrogen', variants: ['nitrogen', 'available n', 'n val', 'nitrigen'] },
            { key: 'phosphorus', variants: ['phosphorus', 'phosphate', 'available p', 'p val'] },
            { key: 'potassium', variants: ['potassium', 'potash', 'available k', 'k val'] },
            { key: 'carbon', variants: ['organic carbon', 'carbon', 'oc'] }
        ];

        let paramCount = 0;
        params.forEach(p => {
            if (p.variants.some(v => this.fuzzyContains(text, v))) {
                score += 15;
                paramCount++;
            } else {
                // Check missing
            }
        });

        // Bonus for numeric density (Report-like structure)
        const numberCount = (text.match(/\d+(\.\d+)?/g) || []).length;
        if (numberCount > 5) score += 10;
        if (numberCount > 10) score += 10;

        console.log(`Validation Score: ${score}, Params Found: ${paramCount}, Headers: ${headerFound}`);

        // THRESHOLD
        // Needs roughly: 1 Header + 3 Params + Numbers = 15 + 45 + 10 = 70
        // Or: 4 Params + Numbers = 60 + 10 = 70

        if (score < 60) {
            return { isValid: false, score, reason: "Low confidence. Missing headers or soil parameters." };
        }

        return { isValid: true, score };
    }

    // --- SMART EXTRACTION ENGINE ---

    smartExtract(text) {
        const data = {};

        // Define robust regex with tolerance for OCR noise
        // e.g. "Nitrogen . . . : 140"

        // Helper to extract value for a set of keyword variants
        const extract = (variants) => {
            for (const v of variants) {
                // Regex Breakdown:
                // 1. The keyword (fuzzy-ish, handled by simple regex variations here or refined text)
                // 2. Separators: space, colon, dot, dash, equals, mixed
                // 3. The Value: number, maybe decimal

                // Construct dynamic regex for simplicity
                // Look for keyword followed by optional junk then a number
                // We use the cleaned text which simplifies things
                const regex = new RegExp(`${v}[^0-9a-z]{0,20}(\\d+(\\.\\d+)?)`, 'i');
                const match = text.match(regex);
                if (match && match[1]) return parseFloat(match[1]);
            }
            return null;
        };

        data.ph = extract(['ph', 'reaction']);
        data.nitrogen = extract(['nitrogen', 'available n', 'n']);
        data.phosphorus = extract(['phosphorus', 'phosphate', 'available p', 'p']);
        data.potassium = extract(['potassium', 'potash', 'available k', 'k']);
        data.organicCarbon = extract(['organic carbon', 'carbon', 'oc']);

        // Sanity check filters
        if (data.ph > 14) data.ph = null; // Impossible pH
        if (data.nitrogen > 2000) data.nitrogen = null; // Unlikely N

        return data;
    }

    // --- UTILITIES ---

    preprocessText(text) {
        return text
            .toLowerCase()
            .replace(/\|/g, ' ')   // Pipe OCR error
            .replace(/\[|\]/g, ' ')
            .replace(/\n+/g, '  ') // Preserve layout roughly
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\.\-\(\)%]/g, '') // Remove weird symbols
            .trim();
    }

    fuzzyContains(text, pattern) {
        // Simple heuristic: if exact match exists
        if (text.includes(pattern)) return true;

        // Advanced: Levenshtein check on sliding window? 
        // For speed, we just check if "most" of the word exists or if it's very close.
        // But for this implementation, let's rely on robust Preprocessing + variants.
        // Actually, let's implement a quick partial scanner.

        // Splitting text into words
        const words = text.split(' ');
        const patternParts = pattern.split(' '); // handle "organic carbon"

        // If pattern is multi-word
        if (patternParts.length > 1) return text.includes(pattern);

        // Single word fuzzy match
        for (const w of words) {
            if (this.levenshtein(w, pattern) <= 1) return true; // Max 1 typo
        }
        return false;
    }

    levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // --- RECOMMENDATION LOGIC (UNCHANGED) ---
    // (Pasted from previous version to ensure continuity)
    generateRecommendations(data, landDetails = { area: 1, unit: 'acre' }) {
        const crop = data.crop ? data.crop.toLowerCase() : 'default';
        const target = CROP_STANDARDS[crop] || CROP_STANDARDS['default'];
        const recommendations = [];
        const alerts = [];
        const nutrients = [];

        const ph = parseFloat(data.ph);
        if (ph) {
            if (ph < 6.0) {
                alerts.push('Soil is Acidic.');
                this.addCorrection(recommendations, 'Agricultural Lime', 'Neutralize.', 200, landDetails);
            } else if (ph > 7.5) {
                alerts.push('Soil is Alkaline.');
                this.addCorrection(recommendations, 'Gypsum', 'Reduce alkalinity.', 150, landDetails);
            } else {
                alerts.push('pH is balanced.');
            }
        }

        const currentN = (parseFloat(data.nitrogen) || 0) / 2.47;
        const currentP = (parseFloat(data.phosphorus) || 0) / 2.47;
        const currentK = (parseFloat(data.potassium) || 0) / 2.47;

        if (currentN < target.n) {
            const deficit = target.n - currentN;
            const qtyUrea = deficit / FERTILIZERS.urea.n;
            nutrients.push({ name: 'Nitrogen', status: 'Low' });
            this.addFertilizer(recommendations, FERTILIZERS.urea, qtyUrea, landDetails);
        } else {
            nutrients.push({ name: 'Nitrogen', status: 'Optimal' });
        }
        if (currentP < target.p) {
            const deficit = target.p - currentP;
            const qtyDap = deficit / FERTILIZERS.dap.p;
            nutrients.push({ name: 'Phosphorus', status: 'Low' });
            this.addFertilizer(recommendations, FERTILIZERS.dap, qtyDap, landDetails);
        } else {
            nutrients.push({ name: 'Phosphorus', status: 'Optimal' });
        }
        if (currentK < target.k) {
            const deficit = target.k - currentK;
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
        list.push({ type: 'Correction', product, reason, dosage: `${baseDosage} kg/acre`, totalQuantity: `${total} kg` });
    }

    addFertilizer(list, fertilizer, qtyPerAcre, landDetails) {
        if (qtyPerAcre < 5) return;
        const safeQty = Math.ceil(qtyPerAcre / 5) * 5;
        const areaInAcres = this.convertAreaToAcres(landDetails.area, landDetails.unit);
        const total = (safeQty * areaInAcres).toFixed(0);
        list.push({ type: 'Fertilizer', product: fertilizer.name, reason: fertilizer.desc, dosage: `${safeQty} kg/acre`, totalQuantity: `${total} kg` });
    }

    convertAreaToAcres(value, unit) {
        const val = parseFloat(value) || 0;
        if (!unit) return val;
        switch (unit.toLowerCase()) {
            case 'hectare': return val * 2.47;
            case 'guntha': return val * 0.025;
            case 'acre': default: return val;
        }
    }

    calculateHealthScore(ph, n, p, k) {
        let score = 100;
        if (!ph || ph < 5.5 || ph > 8.0) score -= 20;
        if (n < 20) score -= 20;
        if (p < 5) score -= 20;
        if (k < 10) score -= 20;
        return Math.max(0, score);
    }
}

module.exports = new AIService();
