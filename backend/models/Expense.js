const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Shopping', 'Bills', 'Healthcare', 'Transportation', 'Entertainment', 'Education', 'Others'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'eSewa', 'Bank Transfer', 'Other'],
    default: 'Cash',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  receiptImage: {
    type: String,
    default: null,
  },
  isOCRScanned: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
