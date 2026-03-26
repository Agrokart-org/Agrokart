const axios = require('axios');
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

const API_Base = 'http://localhost:5000/api';

const log = (msg, color = colors.reset) => console.log(color + msg + colors.reset);

(async () => {
    log('🚀 Starting Verification Script (Limit=1000)...', colors.cyan);

    try {
        // 1. Check Product Visibility (mimic frontend call)
        log('\n📦 Checking Product Visibility with limit=1000...', colors.yellow);
        // Using axios directly like backend test often does
        const productRes = await axios.get(`${API_Base}/products?limit=1000`);

        // Backend returns { products: [], ... } for paginated OR array for simple?
        // Let's handle both.
        const products = productRes.data.products || productRes.data;

        log(`✓ Received ${products.length} products`, colors.green);

        if (products.length === 0) {
            throw new Error('No products found from API with limit=1000');
        }

        const urea = products.find(p => p.name.includes('Test Urea') || p.name.includes('Urea 46%'));
        if (urea) {
            log(`✓ Found product "${urea.name}" (ID: ${urea._id})`, colors.green);
            log(`  Price: ₹${urea.price}`, colors.cyan);
            log(`  Stock: ${urea.stock}`, colors.cyan);
        } else {
            log('❌ "Urea" product NOT found in response!', colors.red);
            console.log('Available products:', products.map(p => p.name));
        }

    } catch (error) {
        log(`❌ Verification Failed: ${error.message}`, colors.red);
        if (error.response) {
            log(`   Status: ${error.response.status}`, colors.red);
            log(`   Data: ${JSON.stringify(error.response.data)}`, colors.red);
        }
    }
})();
