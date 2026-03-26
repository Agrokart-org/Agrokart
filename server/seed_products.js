const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agrokart';

const categories = [
    { name: 'urea', icon: '🌱' },
    { name: 'dap', icon: '🌾' },
    { name: 'npk', icon: '🌿' },
    { name: 'organic', icon: '🍃' },
    { name: 'other', icon: '🔧' }
];

const brands = ['AgroMax', 'TerraNova', 'FarmGear', 'GreenYield', 'CropCare', 'EcoFarm'];

const generateProducts = () => {
    const products = [];

    categories.forEach(cat => {
        // Generate 12 products per category to get ~60 total
        for (let i = 1; i <= 12; i++) {
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const price = Math.floor(Math.random() * 2000) + 100;
            const imageUrl = `https://placehold.co/400x300?text=${cat.name}+${i}`;

            products.push({
                name: `${brand} ${cat.name.toUpperCase()} ${i} - Premium`,
                description: `High quality ${cat.name} for better yield. Version ${i}.`,
                price: price,
                // original_price is not in schema directly? Wait, schema doesn't have original_price. 
                // It has 'price'. It DOES NOT have 'original_price'. 
                // But frontend uses it. Backend schema strict? 
                // MongoDB is schema-less but Mongoose enforces it. 
                // Schema has: name, description, category, brand, price, stock, unit, images, specifications, recommendedCrops, isActive, ratings, averageRating, image, rating, numReviews.
                // NO original_price.

                category: cat.name,
                brand: brand,
                stock: Math.floor(Math.random() * 100) + 10,
                unit: 'kg',
                image: imageUrl, // Required string
                images: [imageUrl, imageUrl], // Required array
                specifications: {
                    // schema: npk, composition, usage, precautions
                    usage: 'Apply 5kg per acre',
                    precautions: 'Wear gloves'
                },
                ratings: [],
                averageRating: 4.5,
                rating: 4.5,
                numReviews: 0
            });
        }
    });

    return products;
};

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const products = generateProducts();

        // Optional: Clear existing? Maybe not, just add.
        // await Product.deleteMany({}); 

        const result = await Product.insertMany(products);
        console.log(`✅ Successfully added ${result.length} products`);

        // Print one ID for testing
        console.log('Sample Product ID:', result[0]._id);

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
