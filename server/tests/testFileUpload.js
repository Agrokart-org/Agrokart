const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Create a dummy file if not exists
const dummyFilePath = path.join(__dirname, 'dummy_report.txt');
if (!fs.existsSync(dummyFilePath)) {
    fs.writeFileSync(dummyFilePath, 'Soil Test Report: pH: 6.5, Nitrogen: 200, Phosphorus: 20, Potassium: 300');
}

async function testUpload() {
    try {
        const form = new FormData();
        form.append('report', fs.createReadStream(dummyFilePath));
        form.append('crop', 'wheat');
        form.append('landArea', '1');
        form.append('unit', 'acre');
        form.append('language', 'en');

        console.log('Sending upload request to localhost:5000...');

        const response = await axios.post('http://localhost:5000/api/dr-agro/analyze-report', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Upload Response Status:', response.status);
        console.log('Upload Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUpload();
