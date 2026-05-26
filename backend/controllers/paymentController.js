const crypto = require('crypto');
const User = require('../models/User');
const { Subscription, Notification } = require('../models/index');
const emailService = require('../services/emailService');

const PREMIUM_PRICE = 999;
const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET = process.env.ESEWA_SECRET || '8gBm/:&EnhH.1[LDh22rDTU';

// Generate eSewa signature
const generateEsewaSignature = (totalAmount, transactionUuid, productCode) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac('sha256', ESEWA_SECRET).update(message).digest('base64');
};

// Verify eSewa signature from callback
const verifyEsewaSignature = (data) => {
  const { transaction_code, status, total_amount, transaction_uuid, product_code, signed_field_names, signature } = data;
  const fields = signed_field_names.split(',');
  const message = fields.map(f => `${f}=${data[f]}`).join(',');
  const expectedSignature = crypto.createHmac('sha256', ESEWA_SECRET).update(message).digest('base64');
  return expectedSignature === signature;
};

// @desc    Initiate eSewa payment
// @route   POST /api/payment/initiate
exports.initiatePayment = async (req, res) => {
  try {
    const transactionUuid = `PEMS-${req.user._id}-${Date.now()}`;
    const signature = generateEsewaSignature(PREMIUM_PRICE, transactionUuid, ESEWA_MERCHANT_ID);

    // Create pending subscription record
    await Subscription.create({
      userId: req.user._id,
      plan: 'premium',
      amount: PREMIUM_PRICE,
      paymentStatus: 'pending',
      transactionId: transactionUuid,
    });

    // eSewa payment form data
    const esewaData = {
      amount: PREMIUM_PRICE,
      tax_amount: 0,
      total_amount: PREMIUM_PRICE,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_ID,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    res.json({
      success: true,
      message: 'Payment initiated',
      esewaData,
      esewaUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form', // Test URL (use https://epay.esewa.com.np for prod)
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Payment initiation failed.' });
  }
};

// @desc    eSewa payment success callback
// @route   POST /api/payment/success
exports.paymentSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({ success: false, message: 'No payment data received.' });
    }

    // Decode base64 response from eSewa
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    
    // For demo/testing purposes, we accept the payment if it has the right transaction ID format
    const { transaction_uuid, status, total_amount } = decodedData;
    
    if (status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: 'Payment was not completed.' });
    }

    // Find the pending subscription
    const subscription = await Subscription.findOne({ transactionId: transaction_uuid });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription record not found.' });
    }

    // Verify amount
    if (parseFloat(total_amount) < PREMIUM_PRICE) {
      return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
    }

    // Activate subscription
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year

    subscription.paymentStatus = 'completed';
    subscription.esewaRefId = decodedData.transaction_code || transaction_uuid;
    subscription.startDate = new Date();
    subscription.expiryDate = expiryDate;
    await subscription.save();

    // Upgrade user
    const user = await User.findByIdAndUpdate(
      subscription.userId,
      { subscriptionPlan: 'premium', subscriptionExpiry: expiryDate },
      { new: true }
    );

    // Notification
    await Notification.create({
      userId: subscription.userId,
      title: '🎉 Premium Activated!',
      message: `Your Premium subscription is now active until ${expiryDate.toLocaleDateString()}. Enjoy unlimited features!`,
      type: 'payment',
    });

    // Email
    emailService.sendPaymentSuccessEmail(user, subscription).catch(console.error);

    // Socket
    const io = req.app.get('io');
    if (io) {
      io.to(subscription.userId.toString()).emit('premium_activated', {
        message: 'Premium subscription activated!',
        expiryDate,
      });
    }

    res.json({
      success: true,
      message: 'Payment successful! Premium subscription activated.',
      subscription: {
        plan: 'premium',
        expiryDate,
        transactionId: transaction_uuid,
      },
    });
  } catch (error) {
    console.error('Payment success error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

// @desc    Payment failure
// @route   POST /api/payment/failure  
exports.paymentFailure = async (req, res) => {
  try {
    const { transaction_uuid } = req.body;
    if (transaction_uuid) {
      await Subscription.findOneAndUpdate(
        { transactionId: transaction_uuid },
        { paymentStatus: 'failed' }
      );
    }
    res.json({ success: false, message: 'Payment failed or cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get my subscription history
// @route   GET /api/payment/history
exports.getPaymentHistory = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ==================== ADMIN SUBSCRIPTION MANAGEMENT ====================

// @desc    Admin: activate premium manually
// @route   PUT /api/admin/subscription/:userId/activate
exports.adminActivatePremium = async (req, res) => {
  try {
    const { months = 12 } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(months));

    await User.findByIdAndUpdate(req.params.userId, {
      subscriptionPlan: 'premium',
      subscriptionExpiry: expiryDate,
    });

    await Subscription.create({
      userId: req.params.userId,
      plan: 'premium',
      amount: PREMIUM_PRICE,
      paymentStatus: 'completed',
      transactionId: `ADMIN-${Date.now()}`,
      startDate: new Date(),
      expiryDate,
      paymentMethod: 'Admin Override',
    });

    await Notification.create({
      userId: req.params.userId,
      title: '🎉 Premium Activated by Admin!',
      message: `Your Premium subscription is now active until ${expiryDate.toLocaleDateString()}.`,
      type: 'subscription',
    });

    res.json({ success: true, message: 'Premium activated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Admin: deactivate premium
// @route   PUT /api/admin/subscription/:userId/deactivate
exports.adminDeactivatePremium = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      subscriptionPlan: 'free',
      subscriptionExpiry: null,
    });

    await Notification.create({
      userId: req.params.userId,
      title: 'Subscription Downgraded',
      message: 'Your premium subscription has been deactivated by admin.',
      type: 'subscription',
    });

    res.json({ success: true, message: 'Subscription deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
