const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

// Admin only access
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
};

// Premium subscription check
exports.requirePremium = (req, res, next) => {
  if (!req.user.isPremium()) {
    return res.status(403).json({
      success: false,
      message: 'This feature requires a Premium subscription.',
      requiresUpgrade: true,
    });
  }
  next();
};

// Generate JWT Token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Check and downgrade expired subscriptions
exports.checkSubscription = async (req, res, next) => {
  if (req.user && req.user.subscriptionPlan === 'premium') {
    if (req.user.subscriptionExpiry && new Date() > new Date(req.user.subscriptionExpiry)) {
      await User.findByIdAndUpdate(req.user._id, { subscriptionPlan: 'free' });
      req.user.subscriptionPlan = 'free';
    }
  }
  next();
};
