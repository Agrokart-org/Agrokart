const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agrokart';

/**
 * 20 REAL Indian Market Agricultural Products
 * These are actual products sold across India by major agri-input companies.
 * Categories match backend enum: urea, dap, npk, organic, other
 */
const realProducts = [
    // ── UREA (4 products) ───────────────────────────────────────────────
    {
        name: 'IFFCO Nano Urea (Liquid) 500ml',
        description: 'IFFCO Nano Urea is India\'s first nano fertilizer developed by IFFCO. One 500ml bottle replaces one 45kg bag of conventional urea. Nano particles ensure 80-90% nitrogen use efficiency. Spray directly on leaves for instant absorption. Government of India approved.',
        category: 'urea',
        brand: 'IFFCO',
        price: 240,
        stock: 300,
        unit: 'bottle',
        image: 'https://m.media-amazon.com/images/I/61HfhkVfTjL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61HfhkVfTjL._SX522_.jpg'],
        specifications: { packSize: '500 ml', nitrogen: '4.0%', formulation: 'Nano Liquid', application: 'Foliar Spray', usage: 'Mix 2-4 ml per litre of water. Spray on leaves at critical growth stages — tillering, flowering, grain filling.', precautions: 'Do not mix with alkaline pesticides. Spray in morning or evening hours. Shake well before use.' },
        recommendedCrops: ['Wheat', 'Rice', 'Maize', 'Sugarcane', 'Vegetables'],
        averageRating: 4.5, rating: 4.5, numReviews: 1842
    },
    {
        name: 'Chambal Uttam Neem Coated Urea 45kg',
        description: 'Chambal Fertilisers\' neem-coated urea under the Uttam brand. As per government mandate, all urea in India is now neem coated, which slows nitrogen release, reduces leaching and improves crop uptake. Trusted by farmers across Rajasthan, UP and MP.',
        category: 'urea',
        brand: 'Chambal (Uttam)',
        price: 267,
        stock: 500,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/71z2XfeqWqL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/71z2XfeqWqL._SX522_.jpg'],
        specifications: { packSize: '45 kg Bag', nitrogen: '46%', neemCoating: '0.5% Neem Oil', formulation: 'Prilled/Granular', usage: 'Apply 50-60 kg/acre as top dressing in 2-3 split doses after irrigation.', precautions: 'Do not mix with seeds directly. Irrigate field after application. Store in dry, covered place.' },
        recommendedCrops: ['Wheat', 'Paddy', 'Sugarcane', 'Cotton', 'Maize'],
        averageRating: 4.3, rating: 4.3, numReviews: 956
    },
    {
        name: 'IFFCO Urea (Kisan Brand) 45kg',
        description: 'Standard neem-coated urea by IFFCO sold under the iconic Kisan brand. Contains 46% nitrogen — the most widely used nitrogen fertilizer across India. MRP fixed by Government of India. Available at all IFFCO cooperative outlets.',
        category: 'urea',
        brand: 'IFFCO (Kisan)',
        price: 267,
        stock: 600,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/61iqfvAaURL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61iqfvAaURL._SX522_.jpg'],
        specifications: { packSize: '45 kg Bag', nitrogen: '46%', neemCoating: 'Yes', formulation: 'Prilled', usage: 'Broadcast 50 kg/acre as top dressing. Apply with irrigation.', precautions: 'Avoid excess application — causes lodging in wheat. Do not apply before heavy rain.' },
        recommendedCrops: ['All Field Crops'],
        averageRating: 4.6, rating: 4.6, numReviews: 3240
    },
    {
        name: 'RCF Suphala Urea 45kg',
        description: 'Rashtriya Chemicals and Fertilizers (RCF) Suphala brand urea — trusted by farmers in Maharashtra, Gujarat and South India for over 50 years. Premium quality neem-coated granular urea with 46% nitrogen.',
        category: 'urea',
        brand: 'RCF (Suphala)',
        price: 267,
        stock: 400,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/61iqfvAaURL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61iqfvAaURL._SX522_.jpg'],
        specifications: { packSize: '45 kg Bag', nitrogen: '46%', neemCoating: 'Yes', biuret: 'Less than 1.5%', usage: 'Apply in 2-3 split doses of 20 kg each per acre during crop growth stages.', precautions: 'Avoid application during heavy rains. Store away from moisture.' },
        recommendedCrops: ['Rice', 'Vegetables', 'Fruits', 'Flowers'],
        averageRating: 4.4, rating: 4.4, numReviews: 1120
    },

    // ── DAP (4 products) ────────────────────────────────────────────────
    {
        name: 'IFFCO DAP (18-46-0) 50kg',
        description: 'India\'s No.1 DAP fertilizer by IFFCO. Di-Ammonium Phosphate with 18% Nitrogen and 46% Phosphorus — essential basal dose fertilizer. Used at sowing time for strong root development. Government subsidized product available at cooperative stores.',
        category: 'dap',
        brand: 'IFFCO',
        price: 1350,
        stock: 200,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/71RfGPHxURL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/71RfGPHxURL._SX522_.jpg'],
        specifications: { packSize: '50 kg HDPE Bag', nitrogen: '18%', phosphorus: '46%', potassium: '0%', formulation: 'Granular', usage: 'Apply 50 kg/acre as basal dose before sowing. Mix with soil during last ploughing.', precautions: 'Best used at sowing time only. Do not use as top dressing. Avoid contact with seeds.' },
        recommendedCrops: ['Wheat', 'Mustard', 'Gram', 'Pulses', 'Potato'],
        averageRating: 4.7, rating: 4.7, numReviews: 4512
    },
    {
        name: 'Coromandel Gromor DAP 50kg',
        description: 'Gromor brand DAP from Coromandel International — one of South India\'s largest fertilizer companies. High-quality Di-Ammonium Phosphate for basal application. Uniform granules ensure even spread through seed drill.',
        category: 'dap',
        brand: 'Coromandel (Gromor)',
        price: 1350,
        stock: 150,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/71RfGPHxURL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/71RfGPHxURL._SX522_.jpg'],
        specifications: { packSize: '50 kg Bag', nitrogen: '18%', phosphorus: '46%', formulation: 'Granular', usage: 'Apply 40-50 kg/acre at 5-8 cm depth near seed zone during sowing.', precautions: 'Store away from moisture and direct sunlight. Do not mix with lime.' },
        recommendedCrops: ['Paddy', 'Groundnut', 'Soybean', 'Cotton'],
        averageRating: 4.5, rating: 4.5, numReviews: 1876
    },
    {
        name: 'IFFCO Nano DAP (Liquid) 500ml',
        description: 'Revolutionary liquid nano DAP by IFFCO — the world\'s first nano DAP. One 500ml bottle provides phosphorus equivalent to a full bag of DAP. Nano particles enter through stomata for 90% efficiency. Huge savings for small and marginal farmers.',
        category: 'dap',
        brand: 'IFFCO',
        price: 600,
        stock: 250,
        unit: 'bottle',
        image: 'https://m.media-amazon.com/images/I/61HfhkVfTjL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61HfhkVfTjL._SX522_.jpg'],
        specifications: { packSize: '500 ml Bottle', phosphorus: '8.0%', formulation: 'Nano Liquid', application: 'Foliar Spray', usage: 'Mix 3-4 ml per litre of water. Spray at root initiation and flowering stages.', precautions: 'Do not mix with strongly acidic/alkaline chemicals. Use within 2 years of manufacturing.' },
        recommendedCrops: ['All Crops'],
        averageRating: 4.3, rating: 4.3, numReviews: 987
    },
    {
        name: 'Zuari Jai Kisaan DAP 50kg',
        description: 'Zuari Agro Chemicals\' DAP sold under the popular "Jai Kisaan" brand. Widely used across Maharashtra, Karnataka, Andhra Pradesh and Telangana. Standard 18-46-0 grade DAP for all crops requiring phosphorus at basal stage.',
        category: 'dap',
        brand: 'Zuari (Jai Kisaan)',
        price: 1350,
        stock: 120,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/71RfGPHxURL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/71RfGPHxURL._SX522_.jpg'],
        specifications: { packSize: '50 kg Bag', nitrogen: '18%', phosphorus: '46%', formulation: 'Granular', usage: '50 kg/acre basal application at sowing. Band placement recommended.', precautions: 'Do not mix with urea for broadcasting. Avoid waterlogged application.' },
        recommendedCrops: ['Sunflower', 'Tur/Arhar', 'Chana', 'Jowar'],
        averageRating: 4.4, rating: 4.4, numReviews: 1340
    },

    // ── NPK (4 products) ───────────────────────────────────────────────
    {
        name: 'IFFCO NPK (10-26-26) 50kg',
        description: 'IFFCO complex fertilizer with NPK ratio 10:26:26 — India\'s most popular NPK grade. Provides balanced nutrition with higher P and K, ideal for vegetable and horticulture crops. Single granule contains all three nutrients.',
        category: 'npk',
        brand: 'IFFCO',
        price: 1470,
        stock: 180,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg'],
        specifications: { packSize: '50 kg Bag', nitrogen: '10%', phosphorus: '26%', potassium: '26%', formulation: 'Complex Granular', usage: 'Apply 50-75 kg/acre as basal dose. Suitable for seed drill application.', precautions: 'Do not mix with urea or SSP. Follow soil test recommendation for best results.' },
        recommendedCrops: ['Potato', 'Onion', 'Tomato', 'Chilli', 'Capsicum'],
        averageRating: 4.8, rating: 4.8, numReviews: 3890
    },
    {
        name: 'Coromandel Gromor 14-35-14 NPK 50kg',
        description: 'Coromandel\'s Gromor brand complex fertilizer with 14:35:14 grade — higher phosphorus for excellent root and flower development. Very popular among onion, garlic and cotton farmers in Maharashtra and Andhra Pradesh.',
        category: 'npk',
        brand: 'Coromandel (Gromor)',
        price: 1450,
        stock: 100,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg'],
        specifications: { packSize: '50 kg Bag', nitrogen: '14%', phosphorus: '35%', potassium: '14%', formulation: 'Complex Granular', usage: 'Apply 60 kg/acre at sowing or transplanting. Place near root zone.', precautions: 'Irrigate within 24 hours of application. Do not apply on dry soil.' },
        recommendedCrops: ['Cotton', 'Onion', 'Garlic', 'Brinjal'],
        averageRating: 4.5, rating: 4.5, numReviews: 1560
    },
    {
        name: 'IFFCO Water Soluble NPK 19-19-19 (1kg)',
        description: 'IFFCO\'s 100% water-soluble NPK fertilizer with equal 19:19:19 ratio. Designed for drip irrigation, fertigation and foliar spray. Completely dissolves in water with zero residue. Essential for precision farming and protected cultivation.',
        category: 'npk',
        brand: 'IFFCO',
        price: 285,
        stock: 300,
        unit: 'kg',
        image: 'https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg'],
        specifications: { packSize: '1 kg Pack', nitrogen: '19%', phosphorus: '19%', potassium: '19%', solubility: '100% Water Soluble', formulation: 'Crystalline Powder', usage: 'Drip: 2-5 kg/acre. Foliar: 5g per litre of water. Apply every 10-15 days.', precautions: 'Use clean water. Do not mix with calcium-based fertilizers. Filter before drip.' },
        recommendedCrops: ['Greenhouse Crops', 'Polyhouse Vegetables', 'Flowers', 'Fruits'],
        averageRating: 4.6, rating: 4.6, numReviews: 2340
    },
    {
        name: 'Zuari Boost 52 (MKP 0-52-34) 1kg',
        description: 'Zuari\'s Boost 52 is Mono Potassium Phosphate — a premium water-soluble fertilizer with 52% Phosphorus and 34% Potassium. Used for flowering induction, fruit setting and quality improvement. Popular in grape, pomegranate and banana cultivation.',
        category: 'npk',
        brand: 'Zuari',
        price: 420,
        stock: 200,
        unit: 'kg',
        image: 'https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61xnSri7jYL._SX522_.jpg'],
        specifications: { packSize: '1 kg Pack', phosphorus: '52%', potassium: '34%', solubility: '100% Water Soluble', formulation: 'Crystalline', usage: 'Foliar: 3-5g per litre. Drip: 1-2 kg/acre per application during flowering.', precautions: 'Avoid mixing with calcium or magnesium solutions. Store in cool dry place.' },
        recommendedCrops: ['Grapes', 'Pomegranate', 'Banana', 'Mango', 'Citrus'],
        averageRating: 4.7, rating: 4.7, numReviews: 876
    },

    // ── ORGANIC (4 products) ────────────────────────────────────────────
    {
        name: 'Multiplex Neem Cake (Organic) 50kg',
        description: 'Neem seed cake organic manure by Multiplex Biotech. Dual action — works as organic fertilizer AND bio-pesticide. Rich in NPK and Azadirachtin which repels nematodes, white ants and soil insects. NPOP certified for organic farming.',
        category: 'organic',
        brand: 'Multiplex',
        price: 650,
        stock: 150,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/51kRXBZf+DL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/51kRXBZf+DL._SX522_.jpg'],
        specifications: { packSize: '50 kg Bag', nitrogen: '5.0%', phosphorus: '1.0%', potassium: '1.5%', organic: 'NPOP Certified', usage: 'Apply 100-200 kg/acre mixed with soil before sowing. Can also be used as mulch around trees.', precautions: 'Use within 6 months. Store in cool dry place away from direct sunlight.' },
        recommendedCrops: ['All Crops', 'Vegetables', 'Fruit Orchards', 'Plantation Crops'],
        averageRating: 4.5, rating: 4.5, numReviews: 2156
    },
    {
        name: 'Coromandel Parry Neemazal T/S (Neem Oil 10000ppm)',
        description: 'Coromandel\'s Parry Neemazal — India\'s leading neem-based bio-pesticide with 10000 ppm Azadirachtin. Acts as insect growth regulator, repellent and antifeedant. Organic farming approved. Safe for beneficial insects and pollinators.',
        category: 'organic',
        brand: 'Coromandel (Parry)',
        price: 450,
        stock: 180,
        unit: 'litre',
        image: 'https://m.media-amazon.com/images/I/51kRXBZf+DL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/51kRXBZf+DL._SX522_.jpg'],
        specifications: { packSize: '1 Litre', activeIngredient: 'Azadirachtin 10000 ppm (1% EC)', organic: 'CIB Registered Bio-Pesticide', usage: 'Mix 2-5 ml per litre of water. Spray on crop canopy. Repeat every 7-10 days.', precautions: 'Shake well before use. Do not mix with alkaline products. Harvest after 3 days PHI.' },
        recommendedCrops: ['Vegetables', 'Cotton', 'Rice', 'Pulses', 'Spices'],
        averageRating: 4.6, rating: 4.6, numReviews: 1245
    },
    {
        name: 'IFFCO Consortium Biofertilizer (Liquid) 500ml',
        description: 'IFFCO\'s liquid biofertilizer consortium containing nitrogen-fixing, phosphorus-solubilizing and potassium-mobilizing bacteria. Improves nutrient availability from soil. Reduces chemical fertilizer dependency by 25%. Ideal for sustainable farming.',
        category: 'organic',
        brand: 'IFFCO',
        price: 190,
        stock: 200,
        unit: 'bottle',
        image: 'https://m.media-amazon.com/images/I/61HfhkVfTjL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61HfhkVfTjL._SX522_.jpg'],
        specifications: { packSize: '500 ml Bottle', contents: 'NPK Consortium Bacteria', cfu: '1×10⁸ CFU/ml minimum', formulation: 'Liquid', usage: 'Seed treatment: 10 ml/kg seed. Soil drench: 500 ml per acre in 200L water.', precautions: 'Do not mix with chemical pesticides. Apply in evening. Store below 30°C.' },
        recommendedCrops: ['All Crops', 'Organic Farms'],
        averageRating: 4.2, rating: 4.2, numReviews: 678
    },
    {
        name: 'Godrej Vipul Vermicompost 50kg',
        description: 'Premium quality vermicompost by Godrej Agrovet. Produced from cattle dung through earthworm composting. Enriches soil with beneficial microorganisms, humic acid and plant growth hormones. FCO compliant. Used widely across Maharashtra and Karnataka.',
        category: 'organic',
        brand: 'Godrej Agrovet',
        price: 400,
        stock: 250,
        unit: 'bag',
        image: 'https://m.media-amazon.com/images/I/51kRXBZf+DL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/51kRXBZf+DL._SX522_.jpg'],
        specifications: { packSize: '50 kg Bag', organicCarbon: '18-25%', nitrogen: '1.5-2%', phosphorus: '0.5-1%', compliance: 'FCO Standards', usage: 'Apply 200-500 kg/acre mixed with topsoil before planting or as mulch.', precautions: 'Keep moist during storage. Avoid direct sunlight. Use within 1 year.' },
        recommendedCrops: ['All Crops', 'Kitchen Garden', 'Lawn', 'Nursery'],
        averageRating: 4.4, rating: 4.4, numReviews: 1890
    },

    // ── OTHER (4 products) ──────────────────────────────────────────────
    {
        name: 'Tata Rallis Tafgor (Dimethoate 30% EC) 1L',
        description: 'Tata Rallis\' Tafgor — India\'s most trusted systemic insecticide-acaricide. Dimethoate 30% EC controls sucking pests like aphids, jassids, thrips and mites. Works on contact and through systemic action. Used across 30+ crops.',
        category: 'other',
        brand: 'Tata Rallis',
        price: 420,
        stock: 80,
        unit: 'litre',
        image: 'https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg'],
        specifications: { packSize: '1 Litre', activeIngredient: 'Dimethoate 30% EC', type: 'Systemic Insecticide-Acaricide', usage: 'Mix 1.5-2 ml per litre of water. Spray thoroughly on crop foliage. Repeat after 15 days if needed.', precautions: 'Toxic — wear gloves, mask and full clothing while spraying. PHI: 14 days. Keep away from water bodies.' },
        recommendedCrops: ['Cotton', 'Rice', 'Vegetables', 'Mango', 'Citrus'],
        averageRating: 4.4, rating: 4.4, numReviews: 3456
    },
    {
        name: 'UPL Saaf Fungicide (Carbendazim 12% + Mancozeb 63% WP) 500g',
        description: 'UPL\'s Saaf is India\'s bestselling combination fungicide. Carbendazim + Mancozeb provides both systemic and contact protection against a wide range of fungal diseases. Used preventively and curatively. Trusted by millions of farmers.',
        category: 'other',
        brand: 'UPL',
        price: 350,
        stock: 100,
        unit: 'pack',
        image: 'https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg'],
        specifications: { packSize: '500 g Pack', activeIngredient: 'Carbendazim 12% + Mancozeb 63% WP', type: 'Combination Fungicide (Systemic + Contact)', usage: 'Mix 2-2.5g per litre of water. Spray at disease onset. Repeat every 10-15 days.', precautions: 'Do not use near fish ponds. Wear protective equipment. PHI varies by crop.' },
        recommendedCrops: ['Rice', 'Wheat', 'Groundnut', 'Grapes', 'Mango', 'Chilli'],
        averageRating: 4.6, rating: 4.6, numReviews: 5670
    },
    {
        name: 'Tata Rallis Manik (Acetamiprid 20% SP) 100g',
        description: 'Tata Manik — neonicotinoid insecticide for sucking pest control. Acetamiprid 20% SP is highly effective against whitefly, aphids, thrips and brown planthopper. Low dose, high efficacy. Safe for IPM programs.',
        category: 'other',
        brand: 'Tata Rallis',
        price: 180,
        stock: 120,
        unit: 'pack',
        image: 'https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg'],
        specifications: { packSize: '100 g Pack', activeIngredient: 'Acetamiprid 20% SP', type: 'Neonicotinoid Systemic Insecticide', usage: 'Mix 0.5g per litre of water. Spray on affected crop. One application usually sufficient.', precautions: 'Moderately toxic to bees — avoid spraying during flowering. PHI: 7-14 days.' },
        recommendedCrops: ['Cotton', 'Rice', 'Okra', 'Tomato', 'Chilli'],
        averageRating: 4.5, rating: 4.5, numReviews: 2890
    },
    {
        name: 'UPL Ulala (Flonicamid 50% WG) 60g',
        description: 'UPL Ulala is a next-generation insecticide with unique mode of action. Flonicamid 50% WG stops aphids and whiteflies from feeding within hours. Very low dose required — just 60g treats one acre. IPM compatible and pollinator-friendly.',
        category: 'other',
        brand: 'UPL',
        price: 550,
        stock: 90,
        unit: 'pack',
        image: 'https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg',
        images: ['https://m.media-amazon.com/images/I/61FV+3D9OzL._SX522_.jpg'],
        specifications: { packSize: '60 g Pack', activeIngredient: 'Flonicamid 50% WG', type: 'Systemic Insecticide (Novel Chemistry)', usage: 'Mix 0.3g per litre of water (60g per acre in 200L spray volume). Single spray effective.', precautions: 'Safe for pollinators. Low mammalian toxicity. Follow label directions for PHI.' },
        recommendedCrops: ['Cotton', 'Chilli', 'Tomato', 'Okra', 'Brinjal', 'Watermelon'],
        averageRating: 4.7, rating: 4.7, numReviews: 1567
    }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing products');

        // Insert 20 real products
        const result = await Product.insertMany(realProducts);
        console.log(`✅ Successfully seeded ${result.length} real Indian market products`);

        // Print summary
        const counts = {};
        result.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
        console.log('\n📊 Category breakdown:');
        Object.entries(counts).forEach(([cat, count]) => console.log(`   ${cat}: ${count} products`));

        console.log('\n🔑 Product names:');
        result.forEach(p => console.log(`   [${p.category}] ${p.name} — ₹${p.price} (${p.brand})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
