const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const multer = require('multer');

// Configure Multer for memory storage (we just need the buffer/file info for mock processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST /api/dr-agro/analyze-report
// @desc    Analyze uploaded soil test report
// @access  Public
router.post('/analyze-report', (req, res, next) => {
    upload.single('report')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('Unknown Upload Error:', err);
            return res.status(500).json({ message: 'File upload failed' });
        }
        next();
    });
}, async (req, res) => {
    console.log('Dr.Agro: Request received');
    try {
        if (!req.file) {
            console.warn('Dr.Agro: No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('Dr.Agro: Analyzing file:', req.file.originalname);

        // Process image/pdf
        // Note: Multer puts text fields in req.body
        const landDetails = {
            area: parseFloat(req.body.landArea) || 1,
            unit: req.body.unit || 'acre'
        };

        // Pass file AND land details (modify aiService if needed to accept 2nd arg)
        // Note: analyzeSoilImage in aiService determines data then calls generateRecommendations
        // We need to pass landDetails to it.
        const analysisResult = await aiService.analyzeSoilImage(req.file);

        // Re-generate recommendations using the correct land details
        // (Since analyzeSoilImage currently doesn't accept landDetails, 
        // we might get default 1 acre results, so let's overwrite or pass it if updated)
        // BETTER: Update aiService.analyzeSoilImage to accept landDetails.
        // For now, let's assume I updated aiService.analyzeSoilImage signature in the previous step?
        // Checking previous step... Yes, but it only takes (file).
        // I need to update it to take (file, landDetails) OR 
        // simpler: regenerate here.

        // Actually, let's just call generateRecommendations again with the parsed data
        // BUT analyzeSoilImage does the OCR work. 
        // Let's modify aiService to accept it.

        // Wait, I can only replace file content here. 
        // I will assume I will fix aiService to accept the second argument or 
        // I will just override the recommendations here if exposed.

        // Re-reading aiService update... I did NOT update analyzeSoilImage signature to take landDetails.
        // It calls this.generateRecommendations(parsedData).
        // So I should have updated it. 

        // STRATEGY: I will update the route to call analyzeSoilImage, get the result, 
        // and if I can't pass the landDetails, I need to update aiService signature NOW.
        // I'll update the route assuming I'll fix the service signature next.

        // WAIT, I just wrote aiService a moment ago. 
        // `async analyzeSoilImage(file) { ... return this.generateRecommendations(parsedData); }`
        // It DOES NOT take landDetails. 

        // I should update aiService again to accept landDetails? 
        // Or I can modify the Result object here?

        // Let's update the route to pass it, and I'll do a quick fix on aiService next.

        const resultWithLand = await aiService.analyzeSoilImage(req.file);
        // Re-run recommendation logic with correct Land details
        const finalResult = aiService.generateRecommendations(resultWithLand.originalData, landDetails);

        console.log('Dr.Agro: Analysis complete');

        res.json({
            success: true,
            data: finalResult
        });

    } catch (err) {
        console.error('Dr.Agro Report Analysis Error:', err);
        res.status(500).json({ message: 'Error analyzing report. Please try again.' });
    }
});

// @route   POST /api/dr-agro/analyze-manual
// @desc    Analyze manually entered soil data
// @access  Public
router.post('/analyze-manual', async (req, res) => {
    try {
        const { ph, nitrogen, phosphorus, potassium, crop } = req.body;

        // Validate inputs
        if (!ph || !nitrogen || !phosphorus || !potassium) {
            return res.status(400).json({ message: 'Please provide all soil parameters (pH, N, P, K).' });
        }

        const soilData = {
            ph: parseFloat(ph),
            nitrogen: parseFloat(nitrogen),
            phosphorus: parseFloat(phosphorus),
            potassium: parseFloat(potassium),
            crop: crop
        };

        const analysisResult = aiService.generateRecommendations(soilData);

        res.json({
            success: true,
            data: analysisResult
        });

    } catch (err) {
        console.error('Dr.Agro Manual Analysis Error:', err);
        res.status(500).json({ message: 'Error generating recommendations.' });
    }
});

module.exports = router;
