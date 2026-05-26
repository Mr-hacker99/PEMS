const User = require('../models/User');
const Expense = require('../models/Expense');
const { Income, Subscription, Notification } = require('../models/index');
const KYC = require('../models/KYC');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers, premiumUsers, freeUsers, blockedUsers,
      totalExpenses, totalTransactions,
      pendingKYC, approvedKYC,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', subscriptionPlan: 'premium' }),
      User.countDocuments({ role: 'user', subscriptionPlan: 'free' }),
      User.countDocuments({ isBlocked: true }),
      Expense.countDocuments(),
      Subscription.countDocuments({ paymentStatus: 'completed' }),
      KYC.countDocuments({ verificationStatus: 'pending' }),
      KYC.countDocuments({ verificationStatus: 'approved' }),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email subscriptionPlan createdAt kycStatus'),
    ]);

    const totalRevenue = await Subscription.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: new Date(new Date().setDate(1)) },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Anomaly detection: users with unusually high expenses
    const anomalies = await Expense.aggregate([
      {
        $group: {
          _id: '$userId',
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 },
          avgExpense: { $avg: '$amount' },
        },
      },
      { $match: { count: { $gte: 5 }, avgExpense: { $gte: 10000 } } },
      { $sort: { totalExpenses: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, premium: premiumUsers, free: freeUsers, blocked: blockedUsers },
        expenses: { total: totalExpenses },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue[0]?.total || 0,
          transactions: totalTransactions,
        },
        kyc: { pending: pendingKYC, approved: approvedKYC },
        anomalies: anomalies.length,
      },
      recentUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan, blocked } = req.query;
    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (plan && plan !== 'all') query.subscriptionPlan = plan;
    if (blocked !== undefined) query.isBlocked = blocked === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot block admin.' });

    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: user.isBlocked ? 'User blocked successfully.' : 'User unblocked successfully.',
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Reset user password (admin)
// @route   POST /api/admin/users/:id/reset-password
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const tempPassword = `Temp${Math.random().toString(36).slice(-6)}@123`;
    user.password = tempPassword;
    await user.save();

    emailService.sendTempPasswordEmail(user, tempPassword).catch(console.error);

    res.json({ success: true, message: `Temporary password sent to ${user.email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin.' });

    await User.findByIdAndDelete(req.params.id);
    // Clean up user data
    await Expense.deleteMany({ userId: req.params.id });
    await Income.deleteMany({ userId: req.params.id });
    await KYC.findOneAndDelete({ userId: req.params.id });

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all subscriptions (admin)
// @route   GET /api/admin/subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ paymentStatus: 'completed' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get anomaly detection report
// @route   GET /api/admin/anomalies
exports.detectAnomalies = async (req, res) => {
  try {
    // Users with unusually high single expenses
    const highExpenses = await Expense.find({ amount: { $gte: 50000 } })
      .populate('userId', 'name email')
      .sort({ amount: -1 })
      .limit(20);

    // Users with many transactions in one day
    const frequentTransactions = await Expense.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          },
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $match: { count: { $gte: 10 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      anomalies: {
        highExpenses,
        frequentTransactions,
        summary: {
          highExpenseCount: highExpenses.length,
          frequentTransactionCount: frequentTransactions.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Send notification to user (admin)
// @route   POST /api/admin/notifications
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    const notification = await Notification.create({ userId, title, message, type });

    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('new_notification', { notification });
    }

    res.status(201).json({ success: true, message: 'Notification sent!', notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all notifications for admin (admin)
// @route   GET /api/admin/notifications
exports.getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
