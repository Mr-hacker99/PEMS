const Expense = require('../models/Expense');
const User = require('../models/User');
const { Notification } = require('../models/index');

const FREE_EXPENSE_LIMIT = 20;

// @desc    Get all expenses for user
// @route   GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (category && category !== 'All') query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      expenses,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Add expense
// @route   POST /api/expenses
exports.addExpense = async (req, res) => {
  try {
    const user = req.user;
    
    // Free plan limit check
    if (!user.isPremium()) {
      const expenseCount = await Expense.countDocuments({ userId: user._id });
      if (expenseCount >= FREE_EXPENSE_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `Free plan allows maximum ${FREE_EXPENSE_LIMIT} expenses. Upgrade to Premium for unlimited expenses.`,
          requiresUpgrade: true,
          currentCount: expenseCount,
          limit: FREE_EXPENSE_LIMIT,
        });
      }
    }

    const { title, amount, category, date, paymentMethod, notes } = req.body;
    
    const expenseData = {
      userId: user._id,
      title,
      amount: parseFloat(amount),
      category,
      date: date || new Date(),
      paymentMethod,
      notes,
    };

    if (req.file) {
      expenseData.receiptImage = `/uploads/receipts/${req.file.filename}`;
      expenseData.isOCRScanned = req.body.isOCRScanned === 'true';
    }

    const expense = await Expense.create(expenseData);

    // Check budget and notify via socket if exceeded
    const { Budget } = require('../models/index');
    const now = new Date();
    const budget = await Budget.findOne({
      userId: user._id,
      category: category,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    if (budget) {
      const monthExpenses = await Expense.aggregate([
        {
          $match: {
            userId: user._id,
            category,
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalSpent = monthExpenses[0]?.total || 0;
      if (totalSpent > budget.limit) {
        const notification = await Notification.create({
          userId: user._id,
          title: 'Budget Exceeded!',
          message: `Your ${category} budget of रु ${budget.limit} has been exceeded. Total spent: रु ${totalSpent}`,
          type: 'budget',
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
          io.to(user._id.toString()).emit('budget_exceeded', { notification, category, totalSpent, limit: budget.limit });
        }
      }
    }

    res.status(201).json({ success: true, message: 'Expense added successfully!', expense });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    const { title, amount, category, date, paymentMethod, notes } = req.body;
    const updateData = { title, amount: parseFloat(amount), category, date, paymentMethod, notes };
    if (req.file) updateData.receiptImage = `/uploads/receipts/${req.file.filename}`;

    const updated = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: 'Expense updated!', expense: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }
    res.json({ success: true, message: 'Expense deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get expense summary stats
// @route   GET /api/expenses/stats
exports.getExpenseStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalAll, totalMonth, categoryStats, monthlyTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: new Date(now.getFullYear(), 0, 1) } } },
        {
          $group: {
            _id: { month: { $month: '$date' }, year: { $year: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalAll: totalAll[0]?.total || 0,
        totalCount: totalAll[0]?.count || 0,
        totalMonth: totalMonth[0]?.total || 0,
        categoryStats,
        monthlyTrend,
        freeLimit: FREE_EXPENSE_LIMIT,
        usedCount: totalAll[0]?.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
