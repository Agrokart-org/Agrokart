const axios = require('axios');
const API_Base = 'http://localhost:5000/api';

(async () => {
    try {
        // 1. Check Health Endpoint
        console.log('Checking Health Endpoint...');
        try {
            const healthRes = await axios.get(`${API_Base}/health`);
            console.log('Health Check Status:', healthRes.status, healthRes.statusText);
        } catch (e) {
            console.error('Health Check Failed:', e.message);
            if (e.response) console.error('Status:', e.response.status);
        }

        // 2. Get list to find an ID
        console.log('Fetching product list...');
        const listRes = await axios.get(`${API_Base}/products?limit=1`);
        const products = listRes.data.products || listRes.data;

        if (products.length === 0) throw new Error('No products found');

        const firstId = products[0]._id || products[0].id;
        console.log(`Found ID: ${firstId}`);

        // 3. Fetch single product
        console.log(`Fetching product details for ${firstId}...`);
        const detailRes = await axios.get(`${API_Base}/products/${firstId}`);

        console.log('Product Details Response:', JSON.stringify(detailRes.data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
