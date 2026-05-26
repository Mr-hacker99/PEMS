require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');
const routes = require('./routes/index');

const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO SETUP ====================
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance on app
app.set('io', io);

// Socket connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins their private room
  socket.on('join', (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    connectedUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
      }
    });
  });
});

// ==================== MIDDLEWARE ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to load
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per window
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'PEMS Backend is running!', timestamp: new Date() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 PEMS Backend Server running on port ${PORT}`);
    console.log(`📡 Socket.IO enabled`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = { app, server };
