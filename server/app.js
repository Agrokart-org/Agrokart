const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({ origin: '*' }));
app.options('*', cors());
app.use(express.json());

// Serve uploaded product images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Main Entity Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Other existing routes registered to prevent breaking the platform
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/dr-agro', require('./routes/drAgro'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/mandi', require('./routes/mandi'));

// Health check endpoint
app.get('/', (req, res) => {
  res.send("AgroKart API Running 🚀");
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Agrokart API is running",
    data: { timestamp: new Date().toISOString() }
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
