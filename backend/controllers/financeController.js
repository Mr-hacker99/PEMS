const { Income, Budget } = require('../models/index');
const Expense = require('../models/Expense');

// ==================== INCOME CONTROLLER ====================

exports.getIncomes = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const query = { userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incomes, total] = await Promise.all([
      Income.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Income.countDocuments(query),
    ]);
    res.json({ success: true, incomes, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.addIncome = async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;
    const income = await Income.create({
      userId: req.user._id,
      title,
      amount: parseFloat(amount),
      category,
      date: date || new Date(),
      notes,
    });
    res.status(201).json({ success: true, message: 'Income added!', income });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ success: false, message: 'Income not found.' });
    res.json({ success: true, message: 'Income updated!', income });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!income) return res.status(404).json({ success: false, message: 'Income not found.' });
    res.json({ success: true, message: 'Income deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getIncomeStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalAll, totalMonth, categoryStats, monthlyTrend] = await Promise.all([
      Income.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Income.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Income.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Income.aggregate([
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
        totalMonth: totalMonth[0]?.total || 0,
        categoryStats,
        monthlyTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ==================== BUDGET CONTROLLER ====================

exports.getBudgets = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;
    const budgets = await Budget.find({ userId: req.user._id, month: parseInt(month), year: parseInt(year) });

    // Get actual spending per category for the month
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
    const spending = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendingMap = {};
    spending.forEach(s => { spendingMap[s._id] = s.spent; });

    const budgetsWithSpending = budgets.map(b => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      remaining: b.limit - (spendingMap[b.category] || 0),
      percentage: Math.min(((spendingMap[b.category] || 0) / b.limit) * 100, 100),
    }));

    res.json({ success: true, budgets: budgetsWithSpending });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.setBudget = async (req, res) => {
  try {
    const now = new Date();
    const { category, limit, month = now.getMonth() + 1, year = now.getFullYear() } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month: parseInt(month), year: parseInt(year) },
      { limit: parseFloat(limit) },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Budget set!', budget });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Budget deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Dashboard summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalIncome, totalExpense, monthIncome, monthExpense, totalBudget, expenseCount] = await Promise.all([
      Income.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Budget.aggregate([
        { $match: { userId, month: now.getMonth() + 1, year: now.getFullYear() } },
        { $group: { _id: null, total: { $sum: '$limit' } } },
      ]),
      Expense.countDocuments({ userId }),
    ]);

    const totalIncomeVal = totalIncome[0]?.total || 0;
    const totalExpenseVal = totalExpense[0]?.total || 0;
    const monthIncomeVal = monthIncome[0]?.total || 0;
    const monthExpenseVal = monthExpense[0]?.total || 0;

    res.json({
      success: true,
      summary: {
        totalIncome: totalIncomeVal,
        totalExpense: totalExpenseVal,
        balance: totalIncomeVal - totalExpenseVal,
        savings: totalIncomeVal - totalExpenseVal,
        monthlyIncome: monthIncomeVal,
        monthlyExpense: monthExpenseVal,
        monthlyBalance: monthIncomeVal - monthExpenseVal,
        monthlyBudget: totalBudget[0]?.total || 0,
        expenseCount,
        freeLimit: 20,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
