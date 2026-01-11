const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Check for required environment variables
if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is not set in .env file");
  console.error("Please create a .env file with: MONGO_URI=your_mongodb_connection_string");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not set in .env file");
  console.error("Please create a .env file with: JWT_SECRET=your_secret_key");
  process.exit(1);
}

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/search", require("./routes/searchRoutes")); // Using in-memory routes for local testing
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/alerts", require("./routes/alertRoutes"));

require("./cron/priceAlertcron");

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
