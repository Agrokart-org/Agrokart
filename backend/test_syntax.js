try {
    const aiService = require('./src/services/aiService');
    console.log('AI Service loaded successfully');
} catch (e) {
    console.error('Failed to load AI Service:', e);
    process.exit(1);
}
