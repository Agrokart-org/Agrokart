const Tesseract = require('tesseract.js');

const RecommendationRules = {
    ph: {
        low: { threshold: 6.0, msg: 'Soil is Acidic', recommendation: 'Use Lime or Dolomite to neutralize acidity.' },
        high: { threshold: 7.5, msg: 'Soil is Alkaline', recommendation: 'Use Gypsum or Sulfur to reduce alkalinity.' },
        ideal: { msg: 'Soil pH is balanced.', recommendation: 'Maintain current soil management practices.' }
    },
    nitrogen: {
        low: { threshold: 280, msg: 'Low Nitrogen', products: ['Urea', 'Ammonium Sulphate'] },
        high: { threshold: 560, msg: 'High Nitrogen', products: [] }
    },
    phosphorus: {
        low: { threshold: 10, msg: 'Low Phosphorus', products: ['DAP (Di-Ammonium Phosphate)', 'Single Super Phosphate (SSP)'] }
    },
    potassium: {
        low: { threshold: 120, msg: 'Low Potassium', products: ['MOP (Muriate of Potash)', 'SOP (Sulphate of Potash)'] }
    }
};

class AIService {
    /**
     * Analyze Soil Report using Tesseract OCR
     */
    async analyzeSoilImage(file) {
        try {
            console.log('AI Service: Starting OCR for file:', file.originalname);

            const { data: { text } } = await Tesseract.recognize(
                file.buffer,
                'eng',
                { logger: m => console.log('OCR Progress:', m.status, m.progress.toFixed(2)) }
            );

            console.log('AI Service: OCR Text Extracted:', text.substring(0, 100) + '...');

            const parsedData = this.parseSoilData(text);

            // If OCR fails to find data, fall back to a "Mock" mode with a flag so UI knows
            if (!parsedData.ph && !parsedData.nitrogen) {
                console.warn('AI Service: OCR failed to extract meaningful data. Using fallback.');
                return {
                    ...this.generateFallbackData(),
                    warning: 'Could not read report clearly. Results are simulated.'
                };
            }

            return this.generateRecommendations(parsedData);

        } catch (error) {
            console.error('AI Service OCR Error:', error);
            throw new Error('Failed to analyze image');
        }
    }

    /* Helper to extract parameters from text using Regex */
    parseSoilData(text) {
        const cleanText = text.replace(/\s+/g, ' ').toLowerCase();

        // Regex patterns for key parameters
        const patterns = {
            ph: /(?:ph|reaction)\s*[:=-]?\s*(\d+(\.\d+)?)/i,
            nitrogen: /(?:nitrogen|n\b|available n)\s*[:=-]?\s*(\d+(\.\d+)?)/i,
            phosphorus: /(?:phosphorus|p\b|available p)\s*[:=-]?\s*(\d+(\.\d+)?)/i,
            potassium: /(?:potassium|k\b|available k)\s*[:=-]?\s*(\d+(\.\d+)?)/i,
            organicCarbon: /(?:organic carbon|oc)\s*[:=-]?\s*(\d+(\.\d+)?)/i
        };

        const data = {};
        for (const [key, regex] of Object.entries(patterns)) {
            const match = cleanText.match(regex);
            if (match && match[1]) {
                data[key] = parseFloat(match[1]);
            }
        }

        console.log('AI Service: Parsed Data:', data);
        return data;
    }

    generateFallbackData() {
        // Fallback for demo if OCR yields nothing (e.g. blurry image)
        const mockData = {
            ph: (Math.random() * (8.5 - 5.5) + 5.5).toFixed(1),
            nitrogen: Math.floor(Math.random() * (600 - 100) + 100),
            phosphorus: Math.floor(Math.random() * (50 - 5) + 5),
            potassium: Math.floor(Math.random() * (400 - 80) + 80),
            organicCarbon: (Math.random() * (1.5 - 0.2) + 0.2).toFixed(2),
            confidence: 0.5
        };
        return this.generateRecommendations(mockData);
    }

    /**
     * Rule-Based Recommendation Engine with Quantity Calculator
     */
    generateRecommendations(data, landDetails = { area: 1, unit: 'acre' }) {
        const recommendations = [];
        const alerts = [];
        const nutrients = [];

        // 1. Analyze pH
        const ph = parseFloat(data.ph);
        if (ph < RecommendationRules.ph.low.threshold) {
            alerts.push(RecommendationRules.ph.low.msg);
            this.addRecommendation(recommendations, 'Correction', 'Agricultural Lime',
                RecommendationRules.ph.low.recommendation, 250, landDetails); // 250kg/acre base
        } else if (ph > RecommendationRules.ph.high.threshold) {
            alerts.push(RecommendationRules.ph.high.msg);
            this.addRecommendation(recommendations, 'Correction', 'Gypsum',
                RecommendationRules.ph.high.recommendation, 200, landDetails); // 200kg/acre base
        } else {
            alerts.push(RecommendationRules.ph.ideal.msg);
        }

        // 2. Analyze Nitrogen
        if (data.nitrogen < RecommendationRules.nitrogen.low.threshold) {
            nutrients.push({ name: 'Nitrogen', status: 'Low' });
            this.addRecommendation(recommendations, 'Fertilizer', 'Urea',
                'Soil is deficient in Nitrogen. Promotes leafy growth.', 50, landDetails); // 50kg/acre base
        } else if (data.nitrogen > RecommendationRules.nitrogen.high.threshold) {
            nutrients.push({ name: 'Nitrogen', status: 'High' });
            recommendations.push({
                type: 'Advisory',
                product: 'Reduce Nitrogen',
                reason: 'Excess Nitrogen detected.',
                dosage: '-',
                totalQuantity: '-'
            });
        } else {
            nutrients.push({ name: 'Nitrogen', status: 'Optimal' });
        }

        // 3. Analyze Phosphorus
        if (data.phosphorus < RecommendationRules.phosphorus.low.threshold) {
            nutrients.push({ name: 'Phosphorus', status: 'Low' });
            this.addRecommendation(recommendations, 'Fertilizer', 'DAP',
                'Low Phosphorus. Crucial for root strength.', 50, landDetails);
        } else {
            nutrients.push({ name: 'Phosphorus', status: 'Optimal' });
        }

        // 4. Analyze Potassium
        if (data.potassium < RecommendationRules.potassium.low.threshold) {
            nutrients.push({ name: 'Potassium', status: 'Low' });
            this.addRecommendation(recommendations, 'Fertilizer', 'MOP (Potash)',
                'Low Potassium. Improves grain quality.', 30, landDetails);
        } else {
            nutrients.push({ name: 'Potassium', status: 'Optimal' });
        }

        return {
            originalData: data,
            healthStatus: this.calculateHealthScore(ph, data.nitrogen, data.phosphorus, data.potassium),
            alerts: alerts,
            nutrients: nutrients,
            recommendations: recommendations,
            landDetails: landDetails
        };
    }

    addRecommendation(list, type, product, reason, baseDosagePerAcre, landDetails) {
        const areaInAcres = this.convertAreaToAcres(landDetails.area, landDetails.unit);
        const totalQty = (baseDosagePerAcre * areaInAcres).toFixed(1);

        list.push({
            type,
            product,
            reason,
            dosage: `${baseDosagePerAcre} kg / acre`,
            totalQuantity: `${totalQty} kg`
        });
    }

    convertAreaToAcres(value, unit) {
        const val = parseFloat(value) || 0;
        switch (unit.toLowerCase()) {
            case 'hectare': return val * 2.47105;
            case 'guntha': return val * 0.025;
            case 'acre':
            default: return val;
        }
    }

    calculateHealthScore(ph, n, p, k) {
        let score = 100;
        if (ph < 6 || ph > 7.5) score -= 10;
        if (n < 280 || n > 560) score -= 10;
        if (p < 10) score -= 10;
        if (k < 120) score -= 10;
        return Math.max(0, score);
    }
}

module.exports = new AIService();
