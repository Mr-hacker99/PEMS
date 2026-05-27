// config/db.js
// FIX: reads MONGO_URI (matching the .env key below)
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is undefined!\n' +
      '  → Local: check that backend/.env has MONGO_URI=mongodb+srv://...\n' +
      '  → Render: add MONGO_URI in the Render dashboard Environment tab.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout (good for Render cold starts)
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    throw error; // server.js will catch this and call process.exit(1)
  }
};

module.exports = connectDB;