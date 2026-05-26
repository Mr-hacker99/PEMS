const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted',
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  profileImage: {
    type: String,
    default: null,
  },
  lastLogin: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if subscription is active
userSchema.methods.isPremium = function () {
  if (this.subscriptionPlan !== 'premium') return false;
  if (!this.subscriptionExpiry) return false;
  return new Date() < new Date(this.subscriptionExpiry);
};

module.exports = mongoose.model('User', userSchema);
