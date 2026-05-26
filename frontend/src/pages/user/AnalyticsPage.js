import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import PremiumGate from '../../components/common/PremiumGate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency, CATEGORY_COLORS, MONTHS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const { isPremium } = useAuth();
  const [expenseStats, setExpenseStats] = useState(null);
  const [incomeStats, setIncomeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, incRes] = await Promise.all([
          api.get('/expenses/stats'),
          api.get('/incomes/stats'),
        ]);
        setExpenseStats(expRes.data.stats);
        setIncomeStats(incRes.data.stats);
      } catch { toast.error('Failed to load analytics.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (!isPremium()) {
    // Show basic analytics for free users
    return (
      <Layout title="Analytics">
        <div className="mb-6">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Basic analytics — upgrade for full charts</p>
        </div>
        {loading ? <LoadingSpinner fullScreen /> : (
          <>
            <BasicAnalytics expenseStats={expenseStats} incomeStats={incomeStats} />
            <div className="mt-6 card bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
              <PremiumGate feature="Advanced Analytics with full charts, forecasting, and category comparisons" />
            </div>
          </>
        )}
      </Layout>
    );
  }

  if (loading) return <Layout title="Analytics"><div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div></Layout>;

  // Build combined monthly data
  const expenseMonthlyMap = {};
  expenseStats?.monthlyTrend?.forEach(item => {
    const key = `${MONTHS[item._id.month - 1]} ${item._id.year}`;
    expenseMonthlyMap[key] = item.total;
  });

  const incomeMonthlyMap = {};
  incomeStats?.monthlyTrend?.forEach(item => {
    const key = `${MONTHS[item._id.month - 1]} ${item._id.year}`;
    incomeMonthlyMap[key] = item.total;
  });

  const allKeys = [...new Set([...Object.keys(expenseMonthlyMap), ...Object.keys(incomeMonthlyMap)])].slice(-12);
  const combinedData = allKeys.map(key => ({
    month: key.split(' ')[0],
    income: incomeMonthlyMap[key] || 0,
    expenses: expenseMonthlyMap[key] || 0,
    savings: (incomeMonthlyMap[key] || 0) - (expenseMonthlyMap[key] || 0),
  }));

  const categoryData = expenseStats?.categoryStats?.map(c => ({
    name: c._id, value: c.total, count: c.count,
  })) || [];

  const incomeCategoryData = incomeStats?.categoryStats?.map(c => ({
    name: c._id, value: c.total,
  })) || [];

  const INCOME_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280'];

  return (
    <Layout title="Analytics">
      <div className="mb-6">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visual breakdown of your financial data</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Income', value: formatCurrency(incomeStats?.totalAll || 0), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Expenses', value: formatCurrency(expenseStats?.totalAll || 0), color: 'text-red-600 dark:text-red-400' },
          { label: 'Net Savings', value: formatCurrency((incomeStats?.totalAll || 0) - (expenseStats?.totalAll || 0)), color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Savings Rate', value: `${incomeStats?.totalAll > 0 ? ((1 - (expenseStats?.totalAll || 0) / incomeStats.totalAll) * 100).toFixed(1) : 0}%`, color: 'text-purple-600 dark:text-purple-400' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Income vs Expense Bar Chart */}
      <div className="card mb-6">
        <h2 className="section-title mb-5">Income vs Expenses (Monthly)</h2>
        {combinedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={combinedData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Savings Trend */}
        <div className="card">
          <h2 className="section-title mb-5">Savings Trend</h2>
          {combinedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={combinedData}>
                <defs>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="savings" stroke="#6366f1" fill="url(#savGrad)" strokeWidth={2} name="Savings" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Expense Category Pie */}
        <div className="card">
          <h2 className="section-title mb-5">Expenses by Category</h2>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" stroke="none">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {categoryData.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#6366f1' }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Income Source Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="section-title mb-5">Income by Source</h2>
          {incomeCategoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={incomeCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {incomeCategoryData.map((entry, i) => (
                      <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {incomeCategoryData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: INCOME_COLORS[i % INCOME_COLORS.length] }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart />}
        </div>

        {/* Expense Line Chart */}
        <div className="card">
          <h2 className="section-title mb-5">Monthly Expense Trend</h2>
          {combinedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} name="Expenses" />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Top Categories Table */}
      {categoryData.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-5">Category Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transactions</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg/Transaction</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {categoryData.map((cat, i) => {
                  const pct = expenseStats?.totalAll > 0 ? (cat.value / expenseStats.totalAll * 100).toFixed(1) : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#6366f1' }} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right text-sm text-gray-500 dark:text-gray-400">{cat.count}</td>
                      <td className="py-3.5 text-right text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(cat.value)}</td>
                      <td className="py-3.5 text-right text-sm text-gray-500 dark:text-gray-400">{formatCurrency(cat.value / (cat.count || 1))}</td>
                      <td className="py-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: (CATEGORY_COLORS[cat.name] || '#6366f1') + '20', color: CATEGORY_COLORS[cat.name] || '#6366f1' }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

const BasicAnalytics = ({ expenseStats, incomeStats }) => {
  const categoryData = expenseStats?.categoryStats?.slice(0, 5).map(c => ({ name: c._id, value: c.total })) || [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="section-title mb-4">Top Expense Categories</h2>
        <div className="space-y-3">
          {categoryData.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{c.name}</span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(c.value)}</span>
            </div>
          ))}
          {categoryData.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-600">No data yet.</p>}
        </div>
      </div>
      <div className="card">
        <h2 className="section-title mb-4">Quick Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
            <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(expenseStats?.totalAll || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total Income</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(incomeStats?.totalAll || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Net Balance</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency((incomeStats?.totalAll || 0) - (expenseStats?.totalAll || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyChart = () => (
  <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-gray-700">
    <BarChart3 size={36} className="mb-2" />
    <p className="text-sm">No data available yet</p>
  </div>
);

export default AnalyticsPage;
