// ============================================================
//  PEMS Backend - server.js  (Fixed & Production-Ready)
//  Fixes:
//    1. Removed duplicate Express app block
//    2. CORS accepts localhost + Vercel URL
//    3. Socket.IO works on Render (polling + websocket)
//    4. Single server.listen() call after DB connects
// ============================================================

require('dotenv').config();           // ← MUST be first line
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const connectDB  = require('./config/db');
const routes     = require('./routes/index');

const app    = express();
const server = http.createServer(app);

// ── Allowed frontend origins ────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',          // Vite (if you ever use it)
  process.env.FRONTEND_URL,        // e.g. https://pems-frontend.vercel.app
].filter(Boolean);                 // removes undefined if FRONTEND_URL not set

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // polling fallback for Render proxy
});

app.set('io', io); // controllers can access io via req.app.get('io')

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

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
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images
}));

// CORS — smart origin checker
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / curl
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiter — 200 requests per 15 min per IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PEMS Backend is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

// ==================== ERROR HANDLERS ====================
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000; // Render auto-sets PORT

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`❤️  Health : http://localhost:${PORT}/health`);
    console.log(`🌐 API    : http://localhost:${PORT}/api`);
    console.log(`📡 Socket : enabled`);
    console.log(`🌍 Env    : ${process.env.NODE_ENV || 'development'}`);
    console.log('========================================\n');
  });
}).catch((err) => {
  console.error('❌ DB connection failed. Server not started:', err.message);
  process.exit(1);
});

module.exports = { app, server };