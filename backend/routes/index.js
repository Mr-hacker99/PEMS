const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const expenseController = require('../controllers/expenseController');
const financeController = require('../controllers/financeController');
const kycController = require('../controllers/kycController');
const paymentController = require('../controllers/paymentController');
const ocrController = require('../controllers/ocrController');
const aiController = require('../controllers/aiController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const { protect, adminOnly, requirePremium } = require('../middleware/auth');
const { uploadKYC, uploadReceipt, uploadProfile } = require('../middleware/upload');

// ==================== AUTH ROUTES ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);
router.get('/auth/verify-email/:token', authController.verifyEmail);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password/:token', authController.resetPassword);
router.put('/auth/profile', protect, uploadProfile, authController.updateProfile);
router.put('/auth/change-password', protect, authController.changePassword);

// ==================== DASHBOARD ====================
router.get('/dashboard', protect, financeController.getDashboardSummary);

// ==================== EXPENSE ROUTES ====================
router.get('/expenses', protect, expenseController.getExpenses);
router.post('/expenses', protect, uploadReceipt, expenseController.addExpense);
router.put('/expenses/:id', protect, uploadReceipt, expenseController.updateExpense);
router.delete('/expenses/:id', protect, expenseController.deleteExpense);
router.get('/expenses/stats', protect, expenseController.getExpenseStats);

// ==================== INCOME ROUTES ====================
router.get('/incomes', protect, financeController.getIncomes);
router.post('/incomes', protect, financeController.addIncome);
router.put('/incomes/:id', protect, financeController.updateIncome);
router.delete('/incomes/:id', protect, financeController.deleteIncome);
router.get('/incomes/stats', protect, financeController.getIncomeStats);

// ==================== BUDGET ROUTES ====================
router.get('/budgets', protect, financeController.getBudgets);
router.post('/budgets', protect, financeController.setBudget);
router.delete('/budgets/:id', protect, financeController.deleteBudget);

// ==================== KYC ROUTES ====================
router.post('/kyc', protect, uploadKYC, kycController.submitKYC);
router.get('/kyc/my', protect, kycController.getMyKYC);

// ==================== PAYMENT ROUTES ====================
router.post('/payment/initiate', protect, paymentController.initiatePayment);
router.post('/payment/success', paymentController.paymentSuccess);
router.get('/payment/success', paymentController.paymentSuccess); // For eSewa GET redirect
router.post('/payment/failure', paymentController.paymentFailure);
router.get('/payment/history', protect, paymentController.getPaymentHistory);

// ==================== OCR ROUTES (Premium only) ====================
router.post('/ocr/scan', protect, requirePremium, uploadReceipt, ocrController.scanReceipt);

// ==================== AI ROUTES (Premium only) ====================
router.get('/ai/analysis', protect, requirePremium, aiController.getFinancialAnalysis);
router.get('/ai/forecast', protect, requirePremium, aiController.getSpendingForecast);
router.post('/ai/chat', protect, requirePremium, aiController.chatWithAI);

// ==================== NOTIFICATION ROUTES ====================
router.get('/notifications', protect, notificationController.getNotifications);
router.put('/notifications/read-all', protect, notificationController.markAllAsRead);
router.put('/notifications/:id/read', protect, notificationController.markAsRead);
router.delete('/notifications/:id', protect, notificationController.deleteNotification);

// ==================== ADMIN ROUTES ====================
router.get('/admin/stats', protect, adminOnly, adminController.getAdminStats);
router.get('/admin/users', protect, adminOnly, adminController.getAllUsers);
router.put('/admin/users/:id/block', protect, adminOnly, adminController.toggleBlockUser);
router.post('/admin/users/:id/reset-password', protect, adminOnly, adminController.resetUserPassword);
router.delete('/admin/users/:id', protect, adminOnly, adminController.deleteUser);
router.get('/admin/subscriptions', protect, adminOnly, adminController.getAllSubscriptions);
router.put('/admin/subscription/:userId/activate', protect, adminOnly, paymentController.adminActivatePremium);
router.put('/admin/subscription/:userId/deactivate', protect, adminOnly, paymentController.adminDeactivatePremium);
router.get('/admin/kyc', protect, adminOnly, kycController.getAllKYC);
router.put('/admin/kyc/:id/approve', protect, adminOnly, kycController.approveKYC);
router.put('/admin/kyc/:id/reject', protect, adminOnly, kycController.rejectKYC);
router.get('/admin/anomalies', protect, adminOnly, adminController.detectAnomalies);
router.post('/admin/notifications', protect, adminOnly, adminController.sendNotification);
router.get('/admin/notifications', protect, adminOnly, adminController.getAdminNotifications);

module.exports = router;
