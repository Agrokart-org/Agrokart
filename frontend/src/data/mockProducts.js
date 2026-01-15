// Mock product data for KrushiDoot fertilizer delivery app
import prodFertilizer from '../assets/prod_fertilizer_npk.png';
import prodSeeds from '../assets/prod_seeds_packet.png';
import prodPesticide from '../assets/prod_pesticide_bottle.png';
import prodTools from '../assets/prod_tools_set.png';

// Categories for reference
const CATEGORIES = {
  FERTILIZERS: 'Fertilizers',
  SEEDS: 'Seeds',
  PESTICIDES: 'Pesticides',
  TOOLS: 'Tools',
  SOIL: 'Soil',
  BIO: 'Bio',
  ORGANIC: 'Organic'
};

const generateProducts = () => {
  const products = [];

  // Helper to generate 50 items for a category
  const generateCategoryItems = (category, image, baseName, basePrice, prefix) => {
    for (let i = 1; i <= 50; i++) {
      products.push({
        _id: `${prefix}${i}`,
        name: `${baseName} ${String.fromCharCode(65 + (i % 26))} - Generic Version ${i}`,
        description: `High-quality ${category} product. Version ${i} with enhanced efficiency and reliability.`,
        category: category,
        brand: i % 3 === 0 ? 'AgroMax' : i % 3 === 1 ? 'TerraNova' : 'FarmGear',
        price: basePrice + (i * 10) + Math.floor(Math.random() * 50),
        originalPrice: basePrice + (i * 10) + 200 + Math.floor(Math.random() * 100),
        stock: 50 + (i % 50),
        unit: 'pack',
        images: [image],
        averageRating: 3.5 + (Math.random() * 1.5),
        ratings: Array(i % 10).fill({ rating: 5, review: 'Good product' }),
        specifications: { type: 'Standard', grade: 'A+' },
        discount: 5 + (i % 25),
        isPopular: i < 10,
        isFeatured: i < 5
      });
    }
  };

  // Generate 100 items for each major category
  generateCategoryItems(CATEGORIES.FERTILIZERS, prodFertilizer, 'Premium Fertilizer', 800, 'fert');
  generateCategoryItems(CATEGORIES.SEEDS, prodSeeds, 'Hybrid Seeds', 400, 'seed');
  generateCategoryItems(CATEGORIES.PESTICIDES, prodPesticide, 'Effective Pesticide', 600, 'pest');
  generateCategoryItems(CATEGORIES.TOOLS, prodTools, 'Farm Tool', 300, 'tool');
  generateCategoryItems(CATEGORIES.BIO, prodFertilizer, 'Bio Booster', 500, 'bio');
  generateCategoryItems(CATEGORIES.ORGANIC, prodSeeds, 'Organic Mix', 900, 'org');

  return products;
};

export const mockProducts = generateProducts();

export const mockCategories = [
  { id: 1, name: 'Electronics', count: 3, icon: '💻' },
  { id: 2, name: 'Fertilizers', count: 20, icon: '🌱' },
  { id: 3, name: 'Seeds', count: 15, icon: '🌾' },
  { id: 4, name: 'Pesticides', count: 15, icon: '🐛' },
  { id: 5, name: 'Tools', count: 10, icon: '🔧' },
  { id: 6, name: 'Soil', count: 5, icon: '🌍' },
  { id: 7, name: 'Bio', count: 5, icon: '🍃' },
  { id: 8, name: 'Organic', count: 5, icon: '🌿' }
];

export const mockFeaturedProducts = mockProducts.filter(product => product.isFeatured);
export const mockPopularProducts = mockProducts.filter(product => product.isPopular);
