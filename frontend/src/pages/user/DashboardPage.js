import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Crown,
  Shield, AlertTriangle, Bell, ArrowRight, Plus
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency, formatDate, getDaysUntilExpiry, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card-hover">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    {loading ? (
      <div className="skeleton h-7 w-28 rounded" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    )}
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </motion.div>
);

const DashboardPage = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, expenseRes, recentRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/expenses/stats'),
          api.get('/expenses?limit=5'),
        ]);
        setSummary(summaryRes.data.summary);
        setExpenseStats(expenseRes.data.stats);
        setRecentExpenses(recentRes.data.expenses);
      } catch (err) {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build chart data from monthly trend
  const chartData = expenseStats?.monthlyTrend?.map(item => ({
    name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][item._id.month - 1],
    expenses: item.total,
  })) || [];

  const daysLeft = getDaysUntilExpiry(user?.subscriptionExpiry);

  return (
    <Layout title="Dashboard">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.kycStatus === 'approved' && (
            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
              <Shield size={11} />KYC Verified
            </span>
          )}
          {isPremium() ? (
            <span className="badge-premium"><Crown size={12} />Premium</span>
          ) : (
            <button onClick={() => navigate('/subscription')} className="btn-primary text-xs py-1.5 px-3">
              <Crown size={13} />Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Subscription Expiry Warning */}
      {isPremium() && daysLeft <= 30 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Your Premium subscription expires in <strong>{daysLeft} days</strong>.{' '}
            <Link to="/subscription" className="underline font-medium">Renew now</Link>
          </p>
        </motion.div>
      )}

      {/* Free plan expense warning */}
      {!isPremium() && summary && summary.expenseCount >= 15 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            You've used <strong>{summary.expenseCount}/20</strong> free expenses.{' '}
            <Link to="/subscription" className="underline font-medium">Upgrade to Premium</Link> for unlimited.
          </p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="xl:col-span-2">
          <StatCard icon={TrendingUp} label="Total Income" value={formatCurrency(summary?.totalIncome)} sub="All time" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(summary?.totalExpense)} sub="All time" color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={Wallet} label="Net Balance" value={formatCurrency(summary?.balance)} sub="Income - Expenses" color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={PiggyBank} label="This Month Income" value={formatCurrency(summary?.monthlyIncome)} sub="Current month" color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={TrendingDown} label="This Month Expenses" value={formatCurrency(summary?.monthlyExpense)} sub="Current month" color="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={Target} label="Monthly Budget" value={formatCurrency(summary?.monthlyBudget)} sub="Set budgets" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Trend Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Expense Trend</h2>
            <Link to="/analytics" className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
              Full Analytics <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="skeleton h-48 w-full rounded-xl" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `रु${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Expenses']} />
                <Area type="monotone" dataKey="expenses" stroke="#6366f1" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-600">
              <TrendingDown size={40} className="mb-2 opacity-30" />
              <p className="text-sm">No expense data yet</p>
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Top Categories</h2>
            <Link to="/expenses" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
            </div>
          ) : expenseStats?.categoryStats?.length > 0 ? (
            <div className="space-y-3">
              {expenseStats.categoryStats.slice(0, 5).map(cat => (
                <div key={cat._id} className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[cat._id] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{cat._id}</span>
                      <span className="text-gray-500 dark:text-gray-400">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((cat.total / (expenseStats.categoryStats[0]?.total || 1)) * 100, 100)}%`,
                          backgroundColor: CATEGORY_COLORS[cat._id] || '#6366f1'
                        }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-600 text-center mt-8">No categories yet</p>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Recent Expenses</h2>
          <div className="flex items-center gap-3">
            <Link to="/expenses" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
            <button onClick={() => navigate('/expenses')} className="btn-primary text-xs py-1.5 px-3">
              <Plus size={13} />Add
            </button>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : recentExpenses.length > 0 ? (
          <div className="space-y-2">
            {recentExpenses.map(exp => (
              <div key={exp._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: (CATEGORY_COLORS[exp.category] || '#6366f1') + '20' }}>
                  {CATEGORY_ICONS[exp.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{exp.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{exp.category} · {formatDate(exp.date)}</p>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400 text-sm flex-shrink-0">
                  -{formatCurrency(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-600 text-sm mb-3">No expenses yet</p>
            <button onClick={() => navigate('/expenses')} className="btn-primary text-sm">
              <Plus size={14} />Add First Expense
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'Add Expense', icon: TrendingDown, path: '/expenses', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
          { label: 'Add Income', icon: TrendingUp, path: '/income', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
          { label: 'Set Budget', icon: Target, path: '/budget', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
          { label: 'Notifications', icon: Bell, path: '/notifications', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button key={label} onClick={() => navigate(path)}
            className={`${color} rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity border border-transparent hover:border-current/10`}>
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </Layout>
  );
};

export default DashboardPage;
