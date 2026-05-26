const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  citizenshipNumber: {
    type: String,
    required: true,
    trim: true,
  },
  profileImage: {
    type: String,
    required: true,
  },
  citizenshipFrontImage: {
    type: String,
    required: true,
  },
  citizenshipBackImage: {
    type: String,
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);
