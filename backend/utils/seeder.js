require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { Income, Budget, Subscription, Notification } = require('../models/index');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pems');
  console.log('✅ MongoDB Connected for seeding');
};

const seedUsers = async () => {
  console.log('🌱 Seeding demo users...');

  // Clear existing demo data
  await User.deleteMany({ email: { $in: ['Shishir@gmail.com', 'Sushant@gmail.com', 'Sushil@gmail.com', 'admin@gmail.com'] } });

  const users = [
    {
      name: 'Shishir Mahara',
      email: 'Shishir@gmail.com',
      password: 'Shishir@123',
      role: 'user',
      subscriptionPlan: 'free',
      isEmailVerified: true,
      kycStatus: 'approved',
    },
    {
      name: 'Sushant Poudel',
      email: 'Sushant@gmail.com',
      password: 'Sushant@123',
      role: 'user',
      subscriptionPlan: 'premium',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isEmailVerified: true,
      kycStatus: 'approved',
    },
    {
      name: 'Sushil Panthi',
      email: 'Sushil@gmail.com',
      password: 'Sushil@123',
      role: 'user',
      subscriptionPlan: 'free', // expired, downgraded
      subscriptionExpiry: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // expired 7 days ago
      isEmailVerified: true,
      kycStatus: 'pending',
    },
    {
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'Admin@123',
      role: 'admin',
      subscriptionPlan: 'premium',
      isEmailVerified: true,
      kycStatus: 'approved',
    },
  ];

  const createdUsers = await User.create(users);
  console.log(`✅ Created ${createdUsers.length} users`);

  const ShishirUser = createdUsers.find(u => u.email === 'Shishir@gmail.com');
  const SushantUser = createdUsers.find(u => u.email === 'Sushant@gmail.com');
  const SushilUser = createdUsers.find(u => u.email === 'Sushil@gmail.com');

  // Clear old data
  await Expense.deleteMany({ userId: { $in: [ShishirUser._id, SushantUser._id, SushilUser._id] } });
  await Income.deleteMany({ userId: { $in: [ShishirUser._id, SushantUser._id, SushilUser._id] } });

  // ==== Shishir Mahara (Free Plan - 10 expenses) ====
  const ShishirExpenses = [
    { userId: ShishirUser._id, title: 'Lunch at Bhojan Griha', amount: 450, category: 'Food', date: new Date('2025-01-05'), paymentMethod: 'Cash', notes: 'Dal Bhat set' },
    { userId: ShishirUser._id, title: 'Bus fare to Lalitpur', amount: 30, category: 'Transportation', date: new Date('2025-01-06'), paymentMethod: 'Cash' },
    { userId: ShishirUser._id, title: 'Electricity bill', amount: 1200, category: 'Bills', date: new Date('2025-01-10'), paymentMethod: 'eSewa' },
    { userId: ShishirUser._id, title: 'Grocery shopping', amount: 2500, category: 'Shopping', date: new Date('2025-01-12'), paymentMethod: 'Cash', notes: 'Monthly groceries from Bhat-Bhateni' },
    { userId: ShishirUser._id, title: 'Doctor consultation', amount: 800, category: 'Healthcare', date: new Date('2025-01-15'), paymentMethod: 'Cash' },
    { userId: ShishirUser._id, title: 'Internet bill', amount: 1100, category: 'Bills', date: new Date('2025-01-18'), paymentMethod: 'eSewa' },
    { userId: ShishirUser._id, title: 'Movie tickets', amount: 600, category: 'Entertainment', date: new Date('2025-01-20'), paymentMethod: 'Card' },
    { userId: ShishirUser._id, title: 'Books for exam', amount: 350, category: 'Education', date: new Date('2025-01-22'), paymentMethod: 'Cash' },
    { userId: ShishirUser._id, title: 'Taxi ride', amount: 250, category: 'Transportation', date: new Date('2025-01-25'), paymentMethod: 'Cash' },
    { userId: ShishirUser._id, title: 'Mobile recharge', amount: 200, category: 'Bills', date: new Date('2025-01-28'), paymentMethod: 'eSewa' },
  ];

  const ShishirIncomes = [
    { userId: ShishirUser._id, title: 'Monthly Salary', amount: 25000, category: 'Salary', date: new Date('2025-01-01') },
    { userId: ShishirUser._id, title: 'Freelance project', amount: 5000, category: 'Freelance', date: new Date('2025-01-15') },
  ];

  // ==== Sushant Poudel (Premium Plan - many expenses) ====
  const SushantExpenses = [];
  const categories = ['Food', 'Shopping', 'Bills', 'Healthcare', 'Transportation', 'Entertainment', 'Education', 'Others'];
  const paymentMethods = ['Cash', 'Card', 'eSewa', 'Bank Transfer'];
  
  const expenseTemplates = [
    { title: 'Restaurant dinner', category: 'Food', minAmount: 500, maxAmount: 3000 },
    { title: 'Online shopping', category: 'Shopping', minAmount: 1000, maxAmount: 8000 },
    { title: 'Electricity bill', category: 'Bills', minAmount: 800, maxAmount: 2500 },
    { title: 'Medical checkup', category: 'Healthcare', minAmount: 500, maxAmount: 3000 },
    { title: 'Uber ride', category: 'Transportation', minAmount: 150, maxAmount: 600 },
    { title: 'Netflix subscription', category: 'Entertainment', minAmount: 400, maxAmount: 800 },
    { title: 'Gym membership', category: 'Entertainment', minAmount: 1500, maxAmount: 3000 },
    { title: 'Online course', category: 'Education', minAmount: 2000, maxAmount: 10000 },
    { title: 'Grocery shopping', category: 'Shopping', minAmount: 2000, maxAmount: 5000 },
    { title: 'Coffee shop', category: 'Food', minAmount: 200, maxAmount: 800 },
  ];

  for (let month = 0; month < 6; month++) {
    for (let i = 0; i < 8; i++) {
      const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];
      const amount = Math.floor(Math.random() * (template.maxAmount - template.minAmount) + template.minAmount);
      SushantExpenses.push({
        userId: SushantUser._id,
        title: template.title,
        amount,
        category: template.category,
        date: new Date(2025, month, Math.floor(Math.random() * 28) + 1),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      });
    }
  }

  const SushantIncomes = [
    { userId: SushantUser._id, title: 'Monthly Salary', amount: 65000, category: 'Salary', date: new Date('2025-01-01') },
    { userId: SushantUser._id, title: 'Monthly Salary', amount: 65000, category: 'Salary', date: new Date('2025-02-01') },
    { userId: SushantUser._id, title: 'Monthly Salary', amount: 65000, category: 'Salary', date: new Date('2025-03-01') },
    { userId: SushantUser._id, title: 'Freelance Income', amount: 15000, category: 'Freelance', date: new Date('2025-01-20') },
    { userId: SushantUser._id, title: 'Investment Returns', amount: 8000, category: 'Investment', date: new Date('2025-02-15') },
    { userId: SushantUser._id, title: 'Business Income', amount: 25000, category: 'Business', date: new Date('2025-03-10') },
  ];

  // ==== Sushil Panthi (Expired Premium) ====
  const SushilExpenses = [
    { userId: SushilUser._id, title: 'Monthly groceries', amount: 3500, category: 'Shopping', date: new Date('2024-12-05') },
    { userId: SushilUser._id, title: 'Internet bill', amount: 1100, category: 'Bills', date: new Date('2024-12-10') },
    { userId: SushilUser._id, title: 'Restaurant lunch', amount: 600, category: 'Food', date: new Date('2024-12-15') },
    { userId: SushilUser._id, title: 'Taxi', amount: 350, category: 'Transportation', date: new Date('2024-12-20') },
    { userId: SushilUser._id, title: 'Medicine', amount: 450, category: 'Healthcare', date: new Date('2024-12-22') },
  ];

  // Sushant's subscription record
  await Subscription.create({
    userId: SushantUser._id,
    plan: 'premium',
    amount: 999,
    paymentStatus: 'completed',
    transactionId: `PEMS-DEMO-Sushant-${Date.now()}`,
    startDate: new Date('2025-01-01'),
    expiryDate: new Date('2026-01-01'),
  });

  // Sushil's expired subscription record
  await Subscription.create({
    userId: SushilUser._id,
    plan: 'premium',
    amount: 999,
    paymentStatus: 'completed',
    transactionId: `PEMS-DEMO-Sushil-${Date.now()}`,
    startDate: new Date('2024-01-01'),
    expiryDate: new Date('2025-01-01'), // expired
  });

  await Promise.all([
    Expense.insertMany(ShishirExpenses),
    Expense.insertMany(SushantExpenses),
    Expense.insertMany(SushilExpenses),
    Income.insertMany(ShishirIncomes),
    Income.insertMany(SushantIncomes),
  ]);

  // Budgets for Sushant
  const budgets = categories.map(cat => ({
    userId: SushantUser._id,
    category: cat,
    limit: Math.floor(Math.random() * 8000) + 2000,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  }));
  await Budget.insertMany(budgets);

  // Sample notifications
  await Notification.insertMany([
    {
      userId: ShishirUser._id,
      title: 'Welcome to PEMS! 🎉',
      message: 'Start tracking your expenses and achieve your financial goals.',
      type: 'info',
    },
    {
      userId: SushilUser._id,
      title: '⚠️ Subscription Expired',
      message: 'Your Premium subscription has expired. Renew now to continue enjoying premium features.',
      type: 'subscription',
    },
    {
      userId: SushantUser._id,
      title: '✅ KYC Approved',
      message: 'Your KYC verification has been approved. You are now a verified user!',
      type: 'kyc',
    },
  ]);

  console.log('✅ All demo data seeded successfully!');
  console.log('\n📧 Demo Credentials:');
  console.log('--------------------------------');
  console.log('FREE USER:    Shishir@gmail.com    | Shishir@123');
  console.log('PREMIUM USER: Sushant@gmail.com   | Sushant@123');
  console.log('EXP. PREMIUM: Sushil@gmail.com   | Sushil@123');
  console.log('ADMIN:        admin@gmail.com  | Admin@123');
  console.log('--------------------------------');
};

const runSeeder = async () => {
  try {
    await connectDB();
    await seedUsers();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

runSeeder();
