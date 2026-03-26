const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

const listProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrokart');
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products:`);
        products.forEach(p => {
            console.log(`- [${p._id}] ${p.name} (Price: ${p.price})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listProducts();
