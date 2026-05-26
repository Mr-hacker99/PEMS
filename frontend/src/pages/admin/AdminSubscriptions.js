import React, { useState, useEffect } from 'react';
import { CreditCard, AlertTriangle, Bell, Send, Crown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminAPI } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ==================== ADMIN SUBSCRIPTIONS ====================
export const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getSubscriptions()
      .then(({ data }) => setSubscriptions(data.subscriptions))
      .catch(() => toast.error('Failed to load subscriptions.'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = subscriptions.reduce((s, sub) => s + (sub.amount || 0), 0);
  const thisMonth = subscriptions.filter(s => {
    const d = new Date(s.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonth.reduce((s, sub) => s + (sub.amount || 0), 0);

  return (
    <Layout title="Subscriptions">
      <div className="mb-6">
        <h1 className="page-title">Subscription Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track all premium subscriptions and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
          { label: 'Total Transactions', value: subscriptions.length, icon: Crown, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  {['User', 'Plan', 'Amount', 'Payment Date', 'Expiry', 'Transaction ID', 'Method'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {subscriptions.map((sub, i) => (
                  <motion.tr key={sub._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sub.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{sub.userId?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-premium text-xs"><Crown size={10} />{sub.plan}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(sub.amount)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(sub.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{sub.expiryDate ? formatDate(sub.expiryDate) : '—'}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate max-w-[120px] block">{sub.transactionId}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{sub.paymentMethod || 'eSewa'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <CreditCard size={40} className="mb-3 opacity-30" />
            <p>No subscription records found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

// ==================== ADMIN ANOMALIES ====================
export const AdminAnomalies = () => {
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnomalies()
      .then(({ data }) => setAnomalies(data.anomalies))
      .catch(() => toast.error('Failed to load anomalies.'))
      .finally(() => setLoading(false));
  }, []);

  const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <Layout title="Anomaly Detection">
      <div className="mb-6">
        <h1 className="page-title">Anomaly Detection</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">AI-powered detection of unusual financial activity</p>
      </div>

      {/* Summary */}
      {anomalies && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className={`card border-2 ${anomalies.summary.highExpenseCount > 0 ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{anomalies.summary.highExpenseCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">High Value Expenses</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Single transactions ≥ रु 50,000</p>
          </div>
          <div className={`card border-2 ${anomalies.summary.frequentTransactionCount > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{anomalies.summary.frequentTransactionCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Frequent Transaction Days</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Users with 10+ transactions in one day</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* High Expenses */}
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              High Value Transactions (≥ रु 50,000)
            </h2>
            {anomalies?.highExpenses?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      {['User', 'Title', 'Category', 'Amount', 'Date'].map(h => (
                        <th key={h} className="text-left py-2.5 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {anomalies.highExpenses.map((exp, i) => (
                      <tr key={i} className="hover:bg-red-50/30 dark:hover:bg-red-900/10">
                        <td className="py-3 pr-4 text-sm font-medium text-gray-700 dark:text-gray-300">{exp.userId?.name || 'Unknown'}</td>
                        <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">{exp.title}</td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400">{exp.category}</td>
                        <td className="py-3 pr-4 text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(exp.amount)}</td>
                        <td className="py-3 text-sm text-gray-400 dark:text-gray-500">{formatDate(exp.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-6 text-center">No high-value transactions detected. ✅</p>
            )}
          </div>

          {/* Frequent Transactions */}
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Unusually Frequent Transaction Days (10+ per day)
            </h2>
            {anomalies?.frequentTransactions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      {['User ID', 'Date', 'Transactions', 'Total Amount'].map(h => (
                        <th key={h} className="text-left py-2.5 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {anomalies.frequentTransactions.map((item, i) => (
                      <tr key={i} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10">
                        <td className="py-3 pr-4 text-xs font-mono text-gray-500 dark:text-gray-400">{item._id.userId?.toString().slice(-8)}</td>
                        <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">{item._id.date}</td>
                        <td className="py-3 pr-4"><span className="text-sm font-bold text-amber-600 dark:text-amber-400">{item.count} transactions</span></td>
                        <td className="py-3 text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-6 text-center">No unusual transaction patterns detected. ✅</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

// ==================== ADMIN NOTIFICATIONS ====================
export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'info' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      adminAPI.getNotifications().then(({ data }) => setNotifications(data.notifications)),
      adminAPI.getUsers({ limit: 100 }).then(({ data }) => setUsers(data.users)),
    ]).catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!form.userId || !form.title || !form.message) {
      toast.error('Please fill all fields.');
      return;
    }
    setSending(true);
    try {
      await adminAPI.sendNotification(form);
      toast.success('Notification sent!');
      setSendModal(false);
      setForm({ userId: '', title: '', message: '', type: 'info' });
      adminAPI.getNotifications().then(({ data }) => setNotifications(data.notifications));
    } catch { toast.error('Failed to send notification.'); }
    finally { setSending(false); }
  };

  const TYPE_COLORS = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    payment: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    kyc: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    budget: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    subscription: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  return (
    <Layout title="Admin Notifications">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notification Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Send and manage platform notifications</p>
        </div>
        <button onClick={() => setSendModal(true)} className="btn-primary">
          <Send size={15} />Send Notification
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {notifications.map((notif, i) => (
              <motion.div key={notif._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${TYPE_COLORS[notif.type] || TYPE_COLORS.info}`}>
                  {notif.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{notif.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                    To: {notif.userId?.name || 'Unknown'} ({notif.userId?.email}) · {formatDate(notif.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                  {notif.isRead ? 'Read' : 'Unread'}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <Bell size={40} className="mb-3 opacity-30" />
            <p>No notifications sent yet</p>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      <Modal isOpen={sendModal} onClose={() => setSendModal(false)} title="Send Notification"
        footer={
          <>
            <button onClick={() => setSendModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="btn-primary">
              {sending ? 'Sending...' : <><Send size={14} />Send</>}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Recipient *</label>
            <select value={form.userId} onChange={e => setForm(prev => ({ ...prev, userId: e.target.value }))} className="input-field">
              <option value="">Select user...</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title" className="input-field" />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3} placeholder="Notification message..." className="input-field resize-none" />
          </div>
          <div>
            <label className="label">Type</label>
            <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} className="input-field">
              {['info', 'success', 'warning', 'error', 'payment', 'kyc', 'budget', 'subscription'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminSubscriptions;
