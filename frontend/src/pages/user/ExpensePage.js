import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Filter, Edit2, Trash2, X, Crown, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Shopping', 'Bills', 'Healthcare', 'Transportation', 'Entertainment', 'Education', 'Others'];
const PAYMENT_METHODS = ['Cash', 'Card', 'eSewa', 'Bank Transfer', 'Other'];
const FREE_LIMIT = 20;

const ExpensePage = () => {
  const { isPremium, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterCategory !== 'All') params.category = filterCategory;
      const { data } = await api.get('/expenses', { params });
      setExpenses(data.expenses);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/expenses/stats');
      setStats(data.stats);
    } catch {}
  };

  useEffect(() => { fetchStats(); }, [expenses.length]);

  const openAdd = () => {
    setEditingExpense(null);
    reset({ date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', category: 'Food' });
    setModalOpen(true);
  };

  const openEdit = (exp) => {
    setEditingExpense(exp);
    reset({
      title: exp.title, amount: exp.amount, category: exp.category,
      date: new Date(exp.date).toISOString().split('T')[0],
      paymentMethod: exp.paymentMethod, notes: exp.notes,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}`, data);
        toast.success('Expense updated!');
      } else {
        await api.post('/expenses', data);
        toast.success('Expense added!');
      }
      setModalOpen(false);
      fetchExpenses();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save expense.';
      if (err.response?.data?.requiresUpgrade) {
        toast.error('Free plan limit reached! Upgrade to Premium for unlimited expenses.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted.');
      setDeleteId(null);
      fetchExpenses();
      fetchStats();
    } catch {
      toast.error('Failed to delete expense.');
    }
  };

  const usedPercent = stats ? Math.min((stats.usedCount / FREE_LIMIT) * 100, 100) : 0;

  return (
    <Layout title="Expenses">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Expense Monitoring</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track and manage your spending</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />Add Expense
        </button>
      </div>

      {/* Free Plan Usage Bar */}
      {!isPremium() && stats && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Free Plan Usage</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.usedCount} / {FREE_LIMIT}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${usedPercent >= 90 ? 'bg-red-500' : usedPercent >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
              style={{ width: `${usedPercent}%` }} />
          </div>
          {stats.usedCount >= FREE_LIMIT && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium">
              Limit reached! <button onClick={() => window.location.href = '/subscription'} className="underline">Upgrade to Premium</button> for unlimited expenses.
            </p>
          )}
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Expenses', value: formatCurrency(stats.totalAll), icon: '💰' },
            { label: 'This Month', value: formatCurrency(stats.totalMonth), icon: '📅' },
            { label: 'Total Count', value: `${stats.totalCount} entries`, icon: '📋' },
            { label: 'Avg/Transaction', value: formatCurrency(stats.totalCount > 0 ? stats.totalAll / stats.totalCount : 0), icon: '📊' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search expenses..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10" />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="input-field pl-10 pr-8 appearance-none min-w-[160px]">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : expenses.length > 0 ? (
          <>
            {/* Mobile List */}
            <div className="block sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {expenses.map(exp => (
                <div key={exp._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{CATEGORY_ICONS[exp.category] || '📦'}</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{exp.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{exp.category} · {formatDate(exp.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600 dark:text-red-400 text-sm">{formatCurrency(exp.amount)}</span>
                      <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(exp._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {expenses.map((exp, i) => (
                    <motion.tr key={exp._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{CATEGORY_ICONS[exp.category] || '📦'}</span>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{exp.title}</p>
                            {exp.notes && <p className="text-xs text-gray-400 truncate max-w-[160px]">{exp.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: (CATEGORY_COLORS[exp.category] || '#6366f1') + '20', color: CATEGORY_COLORS[exp.category] || '#6366f1' }}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(exp.date)}</td>
                      <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400">{exp.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-red-600 dark:text-red-400 text-sm">{formatCurrency(exp.amount)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteId(exp._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 15 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing {((page-1)*15)+1}–{Math.min(page*15,total)} of {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
                  <button onClick={() => setPage(p => p+1)} disabled={page * 15 >= total} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <TrendingDown size={48} className="mb-3 opacity-30" />
            <p className="text-base font-medium mb-1">No expenses found</p>
            <p className="text-sm mb-4">
              {search || filterCategory !== 'All' ? 'Try changing your search or filter.' : 'Start by adding your first expense.'}
            </p>
            <button onClick={openAdd} className="btn-primary text-sm"><Plus size={14} />Add Expense</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button form="expense-form" type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                : editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </>
        }
      >
        <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input {...register('title', { required: 'Title is required' })} placeholder="e.g., Lunch at restaurant" className="input-field" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (NPR) *</label>
              <input {...register('amount', { required: 'Amount required', min: { value: 0.01, message: 'Must be > 0' } })}
                type="number" step="0.01" placeholder="0.00" className="input-field" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <select {...register('category', { required: true })} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input {...register('date', { required: true })} type="date" className="input-field" />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select {...register('paymentMethod')} className="input-field">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea {...register('notes')} placeholder="Additional details..." rows={2} className="input-field resize-none" />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense" size="sm"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this expense? This action cannot be undone.</p>
      </Modal>
    </Layout>
  );
};

export default ExpensePage;
