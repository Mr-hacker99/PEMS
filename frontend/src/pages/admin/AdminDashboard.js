import React, { useState, useEffect } from 'react';
import { Users, Crown, CreditCard, Shield, TrendingUp, AlertTriangle, Bell, UserX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../../components/layout/Layout';
import { adminAPI } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className="card-hover">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
        <Icon size={20} className={color} />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to load admin stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Admin Dashboard"><div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div></Layout>;

  const userChartData = stats ? [
    { name: 'Free', users: stats.stats.users.free, fill: '#6B7280' },
    { name: 'Premium', users: stats.stats.users.premium, fill: '#4F46E5' },
    { name: 'Blocked', users: stats.stats.users.blocked, fill: '#EF4444' },
  ] : [];

  return (
    <Layout title="Admin Dashboard">
      <div className="mb-6">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats?.stats.users.total || 0}
          sub={`${stats?.stats.users.premium || 0} premium`}
          bg="bg-indigo-100 dark:bg-indigo-900/30" color="text-indigo-600 dark:text-indigo-400" />
        <StatCard icon={Crown} label="Premium Users" value={stats?.stats.users.premium || 0}
          sub={`${stats?.stats.users.free || 0} free users`}
          bg="bg-amber-100 dark:bg-amber-900/30" color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={CreditCard} label="Total Revenue" value={formatCurrency(stats?.stats.revenue.total || 0)}
          sub={`${stats?.stats.revenue.transactions || 0} transactions`}
          bg="bg-emerald-100 dark:bg-emerald-900/30" color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={Shield} label="Pending KYC" value={stats?.stats.kyc.pending || 0}
          sub={`${stats?.stats.kyc.approved || 0} approved`}
          bg="bg-purple-100 dark:bg-purple-900/30" color="text-purple-600 dark:text-purple-400" />
        <StatCard icon={TrendingUp} label="Total Expenses" value={stats?.stats.expenses.total || 0}
          bg="bg-red-100 dark:bg-red-900/30" color="text-red-600 dark:text-red-400" />
        <StatCard icon={CreditCard} label="Monthly Revenue" value={formatCurrency(stats?.stats.revenue.monthly || 0)}
          bg="bg-blue-100 dark:bg-blue-900/30" color="text-blue-600 dark:text-blue-400" />
        <StatCard icon={AlertTriangle} label="Anomalies" value={stats?.stats.anomalies || 0}
          sub="Suspicious activity"
          bg="bg-orange-100 dark:bg-orange-900/30" color="text-orange-600 dark:text-orange-400" />
        <StatCard icon={UserX} label="Blocked Users" value={stats?.stats.users.blocked || 0}
          bg="bg-gray-100 dark:bg-gray-700" color="text-gray-600 dark:text-gray-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Distribution Chart */}
        <div className="card">
          <h2 className="section-title mb-5">User Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="users" radius={[6, 6, 0, 0]}>
                {userChartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Review Pending KYC', count: stats?.stats.kyc.pending || 0, href: '/admin/kyc', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' },
              { label: 'Manage Users', count: stats?.stats.users.total || 0, href: '/admin/users', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30' },
              { label: 'View Subscriptions', count: stats?.stats.revenue.transactions || 0, href: '/admin/subscriptions', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' },
              { label: 'Check Anomalies', count: stats?.stats.anomalies || 0, href: '/admin/anomalies', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' },
            ].map(({ label, count, href, color, bg }) => (
              <a key={label} href={href}
                className={`flex items-center justify-between p-3.5 rounded-xl ${bg} transition-colors cursor-pointer`}>
                <span className={`text-sm font-medium ${color}`}>{label}</span>
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-gray-800 ${color}`}>{count}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      {stats?.recentUsers?.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['User', 'Email', 'Plan', 'KYC', 'Joined'].map(h => (
                    <th key={h} className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {stats.recentUsers.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.subscriptionPlan === 'premium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {u.subscriptionPlan === 'premium' ? '👑 Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        u.kycStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        u.kycStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        u.kycStatus === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {u.kycStatus?.replace('_', ' ') || 'Not submitted'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400 dark:text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
