const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

const fs = require('fs');

const inspectProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrokart');
        console.log('Connected to MongoDB');

        const productId = '69835c1edf58249beb789e53';
        const product = await Product.findById(productId);

        if (!product) {
            console.log('Product NOT FOUND');
        } else {
            fs.writeFileSync('product_details.json', JSON.stringify(product, null, 2));
            console.log('Product details written to product_details.json');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectProduct();
