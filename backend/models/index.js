const mongoose = require('mongoose');

// Income Model
const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
  category: {
    type: String,
    enum: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Others'],
    default: 'Others',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
}, { timestamps: true });

// Budget Model
const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Shopping', 'Bills', 'Healthcare', 'Transportation', 'Entertainment', 'Education', 'Others', 'Total'],
  },
  limit: {
    type: Number,
    required: true,
    min: [0, 'Budget limit cannot be negative'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

// Subscription Model
const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  amount: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: {
    type: String,
    default: null,
  },
  esewaRefId: {
    type: String,
    default: null,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  paymentMethod: {
    type: String,
    default: 'eSewa',
  },
}, { timestamps: true });

// Notification Model
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'payment', 'kyc', 'budget', 'subscription'],
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = {
  Income: mongoose.model('Income', incomeSchema),
  Budget: mongoose.model('Budget', budgetSchema),
  Subscription: mongoose.model('Subscription', subscriptionSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
