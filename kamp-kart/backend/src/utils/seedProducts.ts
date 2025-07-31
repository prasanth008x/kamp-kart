import mongoose from 'mongoose';
import Product from '../models/Product';
import connectDB from '../config/database';

const sampleProducts = [
  // Electronics
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Latest flagship smartphone with AI-powered camera and S Pen",
    category: "mobile",
    subcategory: "smartphones",
    brand: "Samsung",
    price: 124999,
    originalPrice: 134999,
    discount: 7,
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500"
    ],
    specifications: {
      "Display": "6.8-inch AMOLED",
      "RAM": "12GB",
      "Storage": "256GB",
      "Camera": "200MP Main",
      "Battery": "5000mAh"
    },
    stock: 50,
    featured: true,
    rating: { average: 4.5, count: 125 },
    tags: ["smartphone", "samsung", "flagship", "5g"],
    seller: { name: "Kamp Electronics", rating: 4.8, location: "Mumbai" },
    shipping: { free: true, cost: 0, estimatedDays: 2 }
  },
  {
    name: "Apple iPhone 15 Pro",
    description: "Premium iPhone with titanium design and Pro camera system",
    category: "mobile",
    subcategory: "smartphones",
    brand: "Apple",
    price: 134900,
    originalPrice: 134900,
    images: [
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500",
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500"
    ],
    specifications: {
      "Display": "6.1-inch Super Retina XDR",
      "Chip": "A17 Pro",
      "Storage": "128GB",
      "Camera": "48MP Main",
      "Battery": "Up to 23 hours video"
    },
    stock: 30,
    featured: true,
    rating: { average: 4.7, count: 89 },
    tags: ["iphone", "apple", "premium", "5g"],
    seller: { name: "Apple Store", rating: 4.9, location: "Delhi" },
    shipping: { free: true, cost: 0, estimatedDays: 1 }
  },

  // Laptops
  {
    name: "MacBook Air M3",
    description: "Ultra-thin laptop with M3 chip and all-day battery life",
    category: "laptops",
    subcategory: "ultrabooks",
    brand: "Apple",
    price: 114900,
    originalPrice: 119900,
    discount: 4,
    images: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"
    ],
    specifications: {
      "Processor": "Apple M3",
      "RAM": "8GB",
      "Storage": "256GB SSD",
      "Display": "13.6-inch Liquid Retina",
      "Weight": "1.24kg"
    },
    stock: 25,
    featured: true,
    rating: { average: 4.6, count: 67 },
    tags: ["macbook", "laptop", "ultrabook", "m3"],
    seller: { name: "Apple Store", rating: 4.9, location: "Bangalore" },
    shipping: { free: true, cost: 0, estimatedDays: 2 }
  },
  {
    name: "Dell XPS 13",
    description: "Premium Windows laptop with InfinityEdge display",
    category: "laptops",
    subcategory: "ultrabooks",
    brand: "Dell",
    price: 89999,
    originalPrice: 99999,
    discount: 10,
    images: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500"
    ],
    specifications: {
      "Processor": "Intel Core i7-1360P",
      "RAM": "16GB",
      "Storage": "512GB SSD",
      "Display": "13.4-inch FHD+",
      "Weight": "1.19kg"
    },
    stock: 35,
    rating: { average: 4.4, count: 92 },
    tags: ["dell", "laptop", "windows", "ultrabook"],
    seller: { name: "Dell Official", rating: 4.7, location: "Chennai" },
    shipping: { free: true, cost: 0, estimatedDays: 3 }
  },

  // Headphones
  {
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling wireless headphones",
    category: "headphones",
    subcategory: "wireless",
    brand: "Sony",
    price: 29990,
    originalPrice: 32990,
    discount: 9,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500"
    ],
    specifications: {
      "Type": "Over-ear",
      "Connectivity": "Bluetooth 5.2",
      "Battery Life": "30 hours",
      "Noise Cancellation": "Yes",
      "Weight": "250g"
    },
    stock: 40,
    featured: true,
    rating: { average: 4.8, count: 156 },
    tags: ["sony", "headphones", "wireless", "noise-canceling"],
    seller: { name: "Sony Store", rating: 4.8, location: "Mumbai" },
    shipping: { free: true, cost: 0, estimatedDays: 2 }
  },

  // Fashion - Men
  {
    name: "Levi's 511 Slim Jeans",
    description: "Classic slim fit jeans in premium denim",
    category: "men",
    subcategory: "jeans",
    brand: "Levi's",
    price: 3999,
    originalPrice: 4999,
    discount: 20,
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500"
    ],
    variants: [
      { size: "30", color: "Dark Blue", stock: 15 },
      { size: "32", color: "Dark Blue", stock: 20 },
      { size: "34", color: "Dark Blue", stock: 18 },
      { size: "30", color: "Light Blue", stock: 12 },
      { size: "32", color: "Light Blue", stock: 16 }
    ],
    stock: 81,
    rating: { average: 4.3, count: 234 },
    tags: ["jeans", "denim", "slim-fit", "casual"],
    seller: { name: "Levi's Store", rating: 4.6, location: "Delhi" },
    shipping: { free: false, cost: 50, estimatedDays: 4 }
  },

  // Fashion - Women
  {
    name: "Zara Floral Summer Dress",
    description: "Beautiful floral print dress perfect for summer occasions",
    category: "women",
    subcategory: "dresses",
    brand: "Zara",
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500"
    ],
    variants: [
      { size: "S", color: "Floral Blue", stock: 8 },
      { size: "M", color: "Floral Blue", stock: 12 },
      { size: "L", color: "Floral Blue", stock: 10 },
      { size: "S", color: "Floral Pink", stock: 6 },
      { size: "M", color: "Floral Pink", stock: 9 }
    ],
    stock: 45,
    featured: true,
    rating: { average: 4.5, count: 78 },
    tags: ["dress", "floral", "summer", "casual"],
    seller: { name: "Zara Fashion", rating: 4.5, location: "Mumbai" },
    shipping: { free: false, cost: 50, estimatedDays: 3 }
  },

  // Shoes
  {
    name: "Nike Air Max 270",
    description: "Comfortable running shoes with Air Max cushioning",
    category: "shoes",
    subcategory: "sneakers",
    brand: "Nike",
    price: 8995,
    originalPrice: 9995,
    discount: 10,
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500"
    ],
    variants: [
      { size: "7", color: "Black", stock: 5 },
      { size: "8", color: "Black", stock: 8 },
      { size: "9", color: "Black", stock: 10 },
      { size: "10", color: "Black", stock: 7 },
      { size: "8", color: "White", stock: 6 },
      { size: "9", color: "White", stock: 9 }
    ],
    stock: 45,
    rating: { average: 4.4, count: 189 },
    tags: ["nike", "sneakers", "running", "air-max"],
    seller: { name: "Nike Store", rating: 4.7, location: "Bangalore" },
    shipping: { free: true, cost: 0, estimatedDays: 2 }
  },

  // Watches
  {
    name: "Apple Watch Series 9",
    description: "Advanced smartwatch with health monitoring and fitness tracking",
    category: "watches",
    subcategory: "smartwatch",
    brand: "Apple",
    price: 41900,
    originalPrice: 41900,
    images: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
      "https://images.unsplash.com/photo-1579586337278-3f436f25d4d7?w=500"
    ],
    specifications: {
      "Display": "45mm Retina",
      "Health": "ECG, Blood Oxygen",
      "Connectivity": "GPS + Cellular",
      "Battery": "18 hours",
      "Water Resistance": "50 meters"
    },
    variants: [
      { size: "41mm", color: "Midnight", stock: 12 },
      { size: "45mm", color: "Midnight", stock: 15 },
      { size: "41mm", color: "Starlight", stock: 10 },
      { size: "45mm", color: "Starlight", stock: 13 }
    ],
    stock: 50,
    featured: true,
    rating: { average: 4.6, count: 98 },
    tags: ["apple", "smartwatch", "fitness", "health"],
    seller: { name: "Apple Store", rating: 4.9, location: "Delhi" },
    shipping: { free: true, cost: 0, estimatedDays: 1 }
  }
];

const seedProducts = async () => {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} sample products`);

    // Display categories
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Products by category:');
    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} products`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedProducts();
}

export default seedProducts;