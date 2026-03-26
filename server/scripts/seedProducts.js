/**
 * Seed Script: Insert 20 products + Vendor Inventory into MongoDB
 * 
 * Run: node scripts/seedProducts.js
 */

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const VendorInventory = require('../src/models/VendorInventory');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrokart';

const products = [
    // ── Fertilizers (6) ──
    {
        name: 'Urea 46-0-0 Premium Grade',
        description: 'High-nitrogen granular urea fertilizer for all crops. Promotes strong vegetative growth and deep green foliage.',
        category: 'urea',
        brand: 'IFFCO',
        price: 350,
        unit: 'kg',
        image: '/images/products/urea.png',
        images: ['/images/products/urea.png'],
        stock: 500,
        specifications: { npk: { nitrogen: 46, phosphorus: 0, potassium: 0 }, usage: 'Top dressing for wheat, rice, maize' },
        recommendedCrops: ['Wheat', 'Rice', 'Maize', 'Sugarcane']
    },
    {
        name: 'DAP 18-46-0 Diammonium Phosphate',
        description: 'Excellent source of phosphorus and nitrogen. Ideal for root development and early plant growth.',
        category: 'dap',
        brand: 'IFFCO',
        price: 1350,
        unit: 'kg',
        image: '/images/products/dap.png',
        images: ['/images/products/dap.png'],
        stock: 300,
        specifications: { npk: { nitrogen: 18, phosphorus: 46, potassium: 0 }, usage: 'Basal application for all crops' },
        recommendedCrops: ['Wheat', 'Rice', 'Cotton', 'Soybean']
    },
    {
        name: 'NPK 10-26-26 Complex',
        description: 'Balanced complex fertilizer with high phosphorus and potassium for flowering and fruiting.',
        category: 'npk',
        brand: 'Coromandel',
        price: 1500,
        unit: 'kg',
        image: '/images/products/npk.png',
        images: ['/images/products/npk.png'],
        stock: 250,
        specifications: { npk: { nitrogen: 10, phosphorus: 26, potassium: 26 }, usage: 'Basal dressing for vegetable & fruit crops' },
        recommendedCrops: ['Tomato', 'Potato', 'Onion', 'Grapes']
    },
    {
        name: 'NPK 20-20-0 Ammonium Phosphate',
        description: 'Nitrogen-phosphorus blend for crops requiring rapid early growth and strong root system.',
        category: 'npk',
        brand: 'Rashtriya Chemicals',
        price: 1200,
        unit: 'kg',
        image: '/images/products/npk2.png',
        images: ['/images/products/npk2.png'],
        stock: 200,
        specifications: { npk: { nitrogen: 20, phosphorus: 20, potassium: 0 }, usage: 'Pre-sowing application' },
        recommendedCrops: ['Rice', 'Wheat', 'Pulses']
    },
    {
        name: 'Vermicompost Organic Manure',
        description: 'Premium quality vermicompost made from earthworm decomposition. Enriches soil with humus and beneficial microbes.',
        category: 'organic',
        brand: 'GreenGold',
        price: 250,
        unit: 'kg',
        image: '/images/products/vermicompost.png',
        images: ['/images/products/vermicompost.png'],
        stock: 1000,
        specifications: { composition: ['Humic acid', 'Nitrogen', 'Phosphorus', 'Potassium', 'Beneficial microbes'], usage: 'Soil enrichment before planting' },
        recommendedCrops: ['All crops', 'Vegetables', 'Fruits']
    },
    {
        name: 'Neem Cake Organic Fertilizer',
        description: 'Natural neem-based fertilizer that acts as both nutrient supplement and pest deterrent.',
        category: 'organic',
        brand: 'AgroNeem',
        price: 400,
        unit: 'kg',
        image: '/images/products/neemcake.png',
        images: ['/images/products/neemcake.png'],
        stock: 600,
        specifications: { composition: ['Azadirachtin', 'Nitrogen', 'Sulphur'], usage: 'Mix with soil before sowing' },
        recommendedCrops: ['Sugarcane', 'Rice', 'Vegetables', 'Cotton']
    },

    // ── Seeds (5) ──
    {
        name: 'Hybrid Tomato Seeds (Lakshmi)',
        description: 'High-yield hybrid tomato seeds with disease resistance. Produces firm, red fruits ideal for market.',
        category: 'other',
        brand: 'Syngenta',
        price: 850,
        unit: 'kg',
        image: '/images/products/tomato_seeds.png',
        images: ['/images/products/tomato_seeds.png'],
        stock: 50,
        specifications: { usage: 'Transplant seedlings after 25 days nursery' },
        recommendedCrops: ['Tomato']
    },
    {
        name: 'Bajra (Pearl Millet) Seeds',
        description: 'Drought-resistant hybrid bajra seeds suitable for arid and semi-arid regions. High grain yield.',
        category: 'other',
        brand: 'Pioneer',
        price: 450,
        unit: 'kg',
        image: '/images/products/bajra_seeds.png',
        images: ['/images/products/bajra_seeds.png'],
        stock: 150,
        specifications: { usage: 'Direct sowing in kharif season' },
        recommendedCrops: ['Bajra']
    },
    {
        name: 'Soybean Seeds (JS-335)',
        description: 'Popular soybean variety with good oil content and high protein. Matures in 95-100 days.',
        category: 'other',
        brand: 'Mahyco',
        price: 600,
        unit: 'kg',
        image: '/images/products/soybean_seeds.png',
        images: ['/images/products/soybean_seeds.png'],
        stock: 200,
        specifications: { usage: 'Sow in June-July with 45cm row spacing' },
        recommendedCrops: ['Soybean']
    },
    {
        name: 'Paddy Seeds (IR-64)',
        description: 'High-yielding paddy rice variety with excellent grain quality and good cooking properties.',
        category: 'other',
        brand: 'ICAR',
        price: 380,
        unit: 'kg',
        image: '/images/products/paddy_seeds.png',
        images: ['/images/products/paddy_seeds.png'],
        stock: 300,
        specifications: { usage: 'Nursery sowing in June, transplanting after 25 days' },
        recommendedCrops: ['Rice']
    },
    {
        name: 'Wheat Seeds (HD-2967)',
        description: 'Bread wheat variety suitable for irrigated conditions. Resistant to leaf rust and yellow rust.',
        category: 'other',
        brand: 'IARI',
        price: 320,
        unit: 'kg',
        image: '/images/products/wheat_seeds.png',
        images: ['/images/products/wheat_seeds.png'],
        stock: 400,
        specifications: { usage: 'Sow in November with 22.5cm row spacing' },
        recommendedCrops: ['Wheat']
    },

    // ── Pesticides (5) ──
    {
        name: 'Chlorpyrifos 20% EC Insecticide',
        description: 'Broad-spectrum organophosphate insecticide for soil and foliar application. Controls termites, aphids, and borers.',
        category: 'other',
        brand: 'Dhanuka',
        price: 520,
        unit: 'kg',
        image: '/images/products/chlorpyrifos.png',
        images: ['/images/products/chlorpyrifos.png'],
        stock: 100,
        specifications: { usage: 'Dilute 2ml/litre for foliar spray', precautions: 'Wear protective gear during application' },
        recommendedCrops: ['Cotton', 'Rice', 'Vegetables']
    },
    {
        name: 'Mancozeb 75% WP Fungicide',
        description: 'Protective fungicide for control of early blight, late blight, and downy mildew.',
        category: 'other',
        brand: 'Indofil',
        price: 680,
        unit: 'kg',
        image: '/images/products/mancozeb.png',
        images: ['/images/products/mancozeb.png'],
        stock: 80,
        specifications: { usage: 'Spray 2.5g/litre at 10-day intervals', precautions: 'Do not mix with alkaline pesticides' },
        recommendedCrops: ['Potato', 'Tomato', 'Grapes', 'Onion']
    },
    {
        name: 'Imidacloprid 17.8% SL Insecticide',
        description: 'Systemic insecticide effective against sucking pests like aphids, jassids, and whiteflies.',
        category: 'other',
        brand: 'Bayer',
        price: 750,
        unit: 'kg',
        image: '/images/products/imidacloprid.png',
        images: ['/images/products/imidacloprid.png'],
        stock: 120,
        specifications: { usage: 'Seed treatment or foliar spray 0.3ml/litre', precautions: 'Toxic to bees; avoid spraying during flowering' },
        recommendedCrops: ['Cotton', 'Rice', 'Vegetables', 'Chilli']
    },
    {
        name: 'Glyphosate 41% SL Herbicide',
        description: 'Non-selective post-emergent herbicide for total weed control in non-crop areas and pre-planting.',
        category: 'other',
        brand: 'Excel Crop Care',
        price: 550,
        unit: 'kg',
        image: '/images/products/glyphosate.png',
        images: ['/images/products/glyphosate.png'],
        stock: 90,
        specifications: { usage: 'Spray 10ml/litre on actively growing weeds', precautions: 'Do not apply on desired crops' },
        recommendedCrops: ['Tea', 'Rubber', 'Orchards']
    },
    {
        name: 'Trichoderma Viride Bio-Pesticide',
        description: 'Eco-friendly biological fungicide for control of soil-borne diseases like root rot and wilt.',
        category: 'organic',
        brand: 'BioGreen',
        price: 350,
        unit: 'kg',
        image: '/images/products/trichoderma.png',
        images: ['/images/products/trichoderma.png'],
        stock: 200,
        specifications: { usage: 'Seed treatment or soil application 2kg/acre', precautions: 'Keep away from chemical fungicides' },
        recommendedCrops: ['All crops']
    },

    // ── Tools & Equipment (4) ──
    {
        name: 'Hand Sprayer 16L Knapsack',
        description: 'Manual knapsack sprayer with brass nozzle and adjustable pressure. 16 litre tank capacity.',
        category: 'other',
        brand: 'Neptune',
        price: 1800,
        unit: 'kg',
        image: '/images/products/sprayer.png',
        images: ['/images/products/sprayer.png'],
        stock: 30,
        specifications: { usage: 'Pesticide and fertilizer liquid spraying' },
        recommendedCrops: ['All crops']
    },
    {
        name: 'Garden Tool Set (5-piece)',
        description: 'Essential garden toolkit including trowel, cultivator, weeder, transplanter, and fork. Rust-resistant coating.',
        category: 'other',
        brand: 'FarmTools',
        price: 950,
        unit: 'kg',
        image: '/images/products/toolset.png',
        images: ['/images/products/toolset.png'],
        stock: 50,
        specifications: { usage: 'Home garden and nursery maintenance' },
        recommendedCrops: ['Vegetables', 'Flowers']
    },
    {
        name: 'Drip Irrigation Kit (1000 sqft)',
        description: 'Complete drip irrigation system with mainline, sub-mainline, laterals, drippers, and fittings for 1000 sqft area.',
        category: 'other',
        brand: 'Jain Irrigation',
        price: 3500,
        unit: 'kg',
        image: '/images/products/drip.png',
        images: ['/images/products/drip.png'],
        stock: 15,
        specifications: { usage: 'Water-efficient irrigation for row crops and orchards' },
        recommendedCrops: ['Vegetables', 'Fruits', 'Cotton']
    },
    {
        name: 'Mulching Sheet (Black, 1m x 400m)',
        description: 'UV-stabilized black plastic mulching sheet for weed suppression, moisture retention, and soil temperature regulation.',
        category: 'other',
        brand: 'PlastiGrow',
        price: 2200,
        unit: 'kg',
        image: '/images/products/mulch.png',
        images: ['/images/products/mulch.png'],
        stock: 20,
        specifications: { usage: 'Lay over raised beds before transplanting' },
        recommendedCrops: ['Tomato', 'Strawberry', 'Chilli', 'Capsicum']
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find the vendor
        const vendor = await User.findOne({ role: 'vendor' });
        if (!vendor) {
            console.error('❌ No vendor found in the database. Please register a vendor first.');
            process.exit(1);
        }
        console.log(`📦 Using vendor: ${vendor.email} (${vendor._id})`);

        // Clear existing data
        await Product.deleteMany({});
        await VendorInventory.deleteMany({});
        console.log('🗑️  Cleared existing Products and VendorInventory');

        // Insert products
        const insertedProducts = await Product.insertMany(products);
        console.log(`✅ Inserted ${insertedProducts.length} products`);

        // Create VendorInventory for each product
        const inventoryEntries = insertedProducts.map(product => ({
            vendor: vendor._id,
            product: product._id,
            stock: 100,           // Each product starts with 100 units
            reservedStock: 0,
            availableStock: 100,
            costPrice: Math.round(product.price * 0.7),  // 70% of selling price
            sellingPrice: product.price,
            isActive: true,
            lastRestocked: new Date(),
            minStockLevel: 10,
            maxStockLevel: 500
        }));

        await VendorInventory.insertMany(inventoryEntries);
        console.log(`✅ Created ${inventoryEntries.length} vendor inventory entries (100 stock each)`);

        // Print summary
        console.log('\n📊 Summary:');
        for (const product of insertedProducts) {
            console.log(`  • ${product.name} (${product.category}) - ₹${product.price}/${product.unit} - ID: ${product._id}`);
        }

        console.log('\n🎉 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
