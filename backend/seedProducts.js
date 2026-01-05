const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/product");

dotenv.config();

const sampleProducts = [
  // iPhone 15 - Different sources
  {
    title: "Apple iPhone 15 (128 GB) - Black",
    price: 69900,
    image: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SX679_.jpg",
    rating: 4.5,
    source: "Amazon",
    category: "Electronics"
  },
  {
    title: "Apple iPhone 15 128GB Black",
    price: 68999,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/r/g/h/-original-imagtc5fz9spysyk.jpeg",
    rating: 4.4,
    source: "Flipkart",
    category: "Electronics"
  },
  {
    title: "Apple iPhone 15 128GB Black",
    price: 69999,
    image: "https://www.croma.com/medias/iPhone-15-128GB-Black-4931787096511-1.jpg",
    rating: 4.6,
    source: "Croma",
    category: "Electronics"
  },
  {
    title: "Apple iPhone 15 128GB Black",
    price: 69500,
    image: "https://www.reliancedigital.in/medias/iPhone-15-128GB-Black-4931787096511-1.jpg",
    rating: 4.5,
    source: "Reliance",
    category: "Electronics"
  },

  // Samsung Galaxy S24
  {
    title: "Samsung Galaxy S24 5G (256GB, 8GB RAM) Onyx Black",
    price: 79999,
    image: "https://m.media-amazon.com/images/I/71vFKBpKakL._AC_SX679_.jpg",
    rating: 4.6,
    source: "Amazon",
    category: "Electronics"
  },
  {
    title: "Samsung Galaxy S24 5G (256GB) Onyx Black",
    price: 78999,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/k/l/l/-original-imagzjgqgqhv8vhx.jpeg",
    rating: 4.5,
    source: "Flipkart",
    category: "Electronics"
  },
  {
    title: "Samsung Galaxy S24 5G 256GB Onyx Black",
    price: 79999,
    image: "https://www.croma.com/medias/Galaxy-S24-256GB-Black-4931787096511-1.jpg",
    rating: 4.7,
    source: "Croma",
    category: "Electronics"
  },
  {
    title: "Samsung Galaxy S24 5G 256GB Onyx Black",
    price: 79499,
    image: "https://www.reliancedigital.in/medias/Galaxy-S24-256GB-Black-4931787096511-1.jpg",
    rating: 4.6,
    source: "Reliance",
    category: "Electronics"
  },

  // OnePlus Pad
  {
    title: "OnePlus Pad Lite with Biggest Battery in Segment",
    price: 13999,
    image: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SX679_.jpg",
    rating: 4.3,
    source: "Amazon",
    category: "Electronics"
  },
  {
    title: "OnePlus Pad Go 28.85 cm 2.4K Display Tablet",
    price: 16999,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/tablet/k/l/h/-original-imagzjgqgqhv8vhx.jpeg",
    rating: 4.4,
    source: "Flipkart",
    category: "Electronics"
  },
  {
    title: "OnePlus Pad 11.61 inch Tablet",
    price: 27999,
    image: "https://www.croma.com/medias/OnePlus-Pad-11-61-inch-4931787096511-1.jpg",
    rating: 4.5,
    source: "Croma",
    category: "Electronics"
  },
  {
    title: "OnePlus Pad 11.61 inch Tablet",
    price: 27499,
    image: "https://www.reliancedigital.in/medias/OnePlus-Pad-11-61-inch-4931787096511-1.jpg",
    rating: 4.4,
    source: "Reliance",
    category: "Electronics"
  },

  // Laptop - MacBook Air
  {
    title: "Apple MacBook Air M2 Chip (13-inch, 8GB RAM, 256GB SSD)",
    price: 99900,
    image: "https://m.media-amazon.com/images/I/71jG+e7roXL._AC_SX679_.jpg",
    rating: 4.7,
    source: "Amazon",
    category: "Electronics"
  },
  {
    title: "Apple MacBook Air M2 13-inch 8GB 256GB",
    price: 98999,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/computer/g/h/h/-original-imagzjgqgqhv8vhx.jpeg",
    rating: 4.6,
    source: "Flipkart",
    category: "Electronics"
  },
  {
    title: "Apple MacBook Air M2 13-inch 8GB 256GB",
    price: 99999,
    image: "https://www.croma.com/medias/MacBook-Air-M2-13-inch-4931787096511-1.jpg",
    rating: 4.8,
    source: "Croma",
    category: "Electronics"
  },
  {
    title: "Apple MacBook Air M2 13-inch 8GB 256GB",
    price: 99499,
    image: "https://www.reliancedigital.in/medias/MacBook-Air-M2-13-inch-4931787096511-1.jpg",
    rating: 4.7,
    source: "Reliance",
    category: "Electronics"
  },

  // Headphones - Sony WH-1000XM5
  {
    title: "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
    price: 27990,
    image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SX679_.jpg",
    rating: 4.6,
    source: "Amazon",
    category: "Electronics"
  },
  {
    title: "Sony WH-1000XM5 ANC Wireless Headphones",
    price: 26999,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/headphone/r/g/h/-original-imagzjgqgqhv8vhx.jpeg",
    rating: 4.5,
    source: "Flipkart",
    category: "Electronics"
  },
  {
    title: "Sony WH-1000XM5 Wireless ANC Headphones",
    price: 27999,
    image: "https://www.croma.com/medias/WH-1000XM5-4931787096511-1.jpg",
    rating: 4.7,
    source: "Croma",
    category: "Electronics"
  },
  {
    title: "Sony WH-1000XM5 Wireless ANC Headphones",
    price: 27499,
    image: "https://www.reliancedigital.in/medias/WH-1000XM5-4931787096511-1.jpg",
    rating: 4.6,
    source: "Reliance",
    category: "Electronics"
  },

  // Smart TV
  {
    title: "Samsung 55 inch 4K Ultra HD Smart LED TV",
    price: 54999,
    image: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SX679_.jpg",
    rating: 4.4,
    source: "Amazon",
    category: "Electronics"
  },
  {
    title: "Samsung 55 inch 4K Smart TV",
    price: 53999,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/television/k/l/h/-original-imagzjgqgqhv8vhx.jpeg",
    rating: 4.3,
    source: "Flipkart",
    category: "Electronics"
  },
  {
    title: "Samsung 55 inch 4K Ultra HD Smart TV",
    price: 54999,
    image: "https://www.croma.com/medias/Samsung-55-inch-4K-4931787096511-1.jpg",
    rating: 4.5,
    source: "Croma",
    category: "Electronics"
  },
  {
    title: "Samsung 55 inch 4K Ultra HD Smart TV",
    price: 54499,
    image: "https://www.reliancedigital.in/medias/Samsung-55-inch-4K-4931787096511-1.jpg",
    rating: 4.4,
    source: "Reliance",
    category: "Electronics"
  },

  // Kitchen - Mixer Grinder
  {
    title: "Preethi Zodiac MG 218 750-Watt Mixer Grinder",
    price: 5999,
    image: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SX679_.jpg",
    rating: 4.3,
    source: "Amazon",
    category: "Kitchen"
  },
  {
    title: "Preethi Zodiac MG 218 750W Mixer Grinder",
    price: 5899,
    image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mixer-grinder/k/l/h/-original-imagzjgqgqhv8vhx.jpeg",
    rating: 4.2,
    source: "Flipkart",
    category: "Kitchen"
  },
  {
    title: "Preethi Zodiac MG 218 750W Mixer Grinder",
    price: 5999,
    image: "https://www.croma.com/medias/Preethi-Zodiac-MG-218-4931787096511-1.jpg",
    rating: 4.4,
    source: "Croma",
    category: "Kitchen"
  },
  {
    title: "Preethi Zodiac MG 218 750W Mixer Grinder",
    price: 5949,
    image: "https://www.reliancedigital.in/medias/Preethi-Zodiac-MG-218-4931787096511-1.jpg",
    rating: 4.3,
    source: "Reliance",
    category: "Kitchen"
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({});
    // console.log("Cleared existing products");

    // Insert sample products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`✅ Successfully added ${inserted.length} products to database!`);

    // Show summary by source
    const summary = await Product.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log("\n📊 Products by Source:");
    summary.forEach(item => {
      console.log(`   ${item._id || 'No Source'}: ${item.count} products`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();

