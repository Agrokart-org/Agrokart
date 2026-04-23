require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Create HTTP server instead of plain express app to support Socket.IO
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
