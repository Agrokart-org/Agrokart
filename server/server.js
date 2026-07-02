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

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const app = express();

// Trust proxy for rate limiting behind Vercel/Render/Heroku
app.set("trust proxy", 1);

// --- SECURITY MIDDLEWARES ---
// 1. HTTP Security Headers (Strict CSP and HSTS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Prevents breaking capacitor local images
}));

// 2. Rate Limiting (Brute Force Protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", globalLimiter);

// 3. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 4. Data Sanitization against XSS
app.use(xss());

// 4b. HTTP Parameter Pollution Protection
app.use(hpp());

// Request Logger (Moved before CORS to catch preflight)
app.use((req, res, next) => {
  // Disable logging in production to prevent sensitive data leakage
  if (process.env.NODE_ENV !== "production") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// 5. Strict CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.FRONTEND_URL // Will fall back to undefined if not set, handled by CORS module
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.options("*", cors()); // Enable pre-flight for all routes
app.use(express.json({ limit: "10kb" })); // Limit body payload size
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
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Only log full error stack in development
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  } else {
    // Basic log for production without leaking stack trace to standard output if not needed
    console.error(`[ERROR] ${err.message}`);
  }

  const statusCode = err.statusCode || 500;
  const message = (process.env.NODE_ENV === "production" && statusCode === 500) 
    ? "Internal Server Error" 
    : err.message || "Something went wrong!";

  res.status(statusCode).json({ 
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Enforce strict query for Mongoose 7+ compatibility and NoSQL injection prevention
mongoose.set("strictQuery", true);

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
