require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const ordersRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/admin");
const vendorRoutes = require("./routes/vendor");
const deliveryRoutes = require("./routes/delivery");
const paymentRoutes = require("./routes/paymentRoutes");
const drAgroRoutes = require("./routes/drAgro");
const weatherRoutes = require("./routes/weather");
const mandiRoutes = require("./routes/mandi");

const app = express();

// Middleware
// Request Logger (Moved before CORS to catch preflight)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", JSON.stringify(req.headers));
  next();
});

app.use(cors({ origin: "*" }));
app.options("*", cors()); // Enable pre-flight for all routes
app.use(express.json());
app.use(express.static("public"));

// Health check endpoint for mobile connectivity testing
app.get("/", (req, res) => res.send("API Running"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Agrokart API is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/dr-agro", drAgroRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/mandi", mandiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

// Create HTTP server
const http = require("http");
const server = http.createServer(app);

// Initialize Socket.io
const { initializeSocket } = require("./services/socketService");
const io = initializeSocket(server);

// Try different ports if 5000 is in use
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.43.196:${PORT}`); // Your IP for mobile access
});
