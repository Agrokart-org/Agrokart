const axios = require('axios');

async function testDrAgro() {
    console.log('Testing Dr. Agro Manual Analysis...');

    // Test Case 1: Wheat (English) - Low N
    const payload1 = {
        crop: 'wheat',
        ph: 6.5,
        nitrogen: 120, // Low for wheat
        phosphorus: 40,
        potassium: 200,
        language: 'en'
    };

    try {
        console.log('\n--- Request 1: English / Wheat ---');
        const res1 = await axios.post('http://localhost:5000/api/dr-agro/analyze-manual', payload1);
        console.log('Success:', res1.data.success);
        if (res1.data.success) {
            console.log('Health Summary:', res1.data.data.healthSummary);
            console.log('Recommendations:', res1.data.data.recommendations.length);
            console.log('First Rec:', res1.data.data.recommendations[0]);
            console.log('Confidence:', res1.data.data.confidenceScore);
        } else {
            console.log('Message:', res1.data.message);
        }
    } catch (err) {
        console.error('Error 1:', err.response ? err.response.data : err.message);
    }

    // Test Case 2: Sugarcane (Hindi)
    const payload2 = {
        crop: 'sugarcane',
        ph: 7.2,
        nitrogen: 200,
        phosphorus: 60,
        potassium: 100, // Low for Sugarcane?
        language: 'hi'
    };

    try {
        console.log('\n--- Request 2: Hindi / Sugarcane ---');
        const res2 = await axios.post('http://localhost:5000/api/dr-agro/analyze-manual', payload2);
        console.log('Success:', res2.data.success);
        if (res2.data.success) {
            console.log('Health Summary:', res2.data.data.healthSummary);
            // Verify Hindi characters exist
            console.log('Contains Hindi:', /[अ-ह]/.test(res2.data.data.healthSummary));
        }
    } catch (err) {
        console.error('Error 2:', err.response ? err.response.data : err.message);
    }
}

testDrAgro();
