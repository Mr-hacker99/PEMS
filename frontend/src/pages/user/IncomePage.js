import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { formatCurrency, formatDate, INCOME_CATEGORY_COLORS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Others'];
const INCOME_ICONS = { Salary: '💼', Freelance: '💻', Business: '🏪', Investment: '📈', Gift: '🎁', Others: '💰' };

const IncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const [incomesRes, statsRes] = await Promise.all([
        api.get('/incomes', { params: { limit: 50 } }),
        api.get('/incomes/stats'),
      ]);
      setIncomes(incomesRes.data.incomes);
      setStats(statsRes.data.stats);
    } catch { toast.error('Failed to load income data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  const openAdd = () => {
    setEditingIncome(null);
    reset({ date: new Date().toISOString().split('T')[0], category: 'Salary' });
    setModalOpen(true);
  };

  const openEdit = (income) => {
    setEditingIncome(income);
    reset({ title: income.title, amount: income.amount, category: income.category,
      date: new Date(income.date).toISOString().split('T')[0], notes: income.notes });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingIncome) {
        await api.put(`/incomes/${editingIncome._id}`, data);
        toast.success('Income updated!');
      } else {
        await api.post('/incomes', data);
        toast.success('Income added!');
      }
      setModalOpen(false);
      fetchIncomes();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/incomes/${id}`);
      toast.success('Income deleted.');
      setDeleteId(null);
      fetchIncomes();
    } catch { toast.error('Failed to delete.'); }
  };

  return (
    <Layout title="Income">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Income Monitoring</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track all your income sources</p>
        </div>
        <button onClick={openAdd} className="btn-success"><Plus size={16} />Add Income</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Income', value: formatCurrency(stats.totalAll), icon: '💰', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'This Month', value: formatCurrency(stats.totalMonth), icon: '📅', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Sources', value: `${stats.categoryStats?.length || 0} types`, icon: '📊', color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Records', value: `${incomes.length} entries`, icon: '📋', color: 'text-indigo-600 dark:text-indigo-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <span className="text-2xl">{s.icon}</span>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      {stats?.categoryStats?.length > 0 && (
        <div className="card mb-5">
          <h2 className="section-title mb-4">Income by Source</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.categoryStats.map(cat => (
              <div key={cat._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <span className="text-2xl">{INCOME_ICONS[cat._id] || '💰'}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cat._id}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(cat.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income List */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : incomes.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {incomes.map((income, i) => (
              <motion.div key={income._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: (INCOME_CATEGORY_COLORS[income.category] || '#10B981') + '20' }}>
                  {INCOME_ICONS[income.category] || '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{income.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{income.category} · {formatDate(income.date)}</p>
                  {income.notes && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{income.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(income.amount)}</span>
                  <button onClick={() => openEdit(income)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setDeleteId(income._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <TrendingUp size={48} className="mb-3 opacity-30" />
            <p className="font-medium mb-1">No income records yet</p>
            <p className="text-sm mb-4">Start tracking your income sources.</p>
            <button onClick={openAdd} className="btn-success text-sm"><Plus size={14} />Add Income</button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingIncome ? 'Edit Income' : 'Add Income'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button form="income-form" type="submit" disabled={submitting} className="btn-success">
              {submitting ? 'Saving...' : editingIncome ? 'Update' : 'Add Income'}
            </button>
          </>
        }
      >
        <form id="income-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input {...register('title', { required: 'Title is required' })} placeholder="e.g., Monthly Salary" className="input-field" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (NPR) *</label>
              <input {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
                type="number" step="0.01" placeholder="0.00" className="input-field" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input-field">
                {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{INCOME_ICONS[c]} {c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Date *</label>
            <input {...register('date', { required: true })} type="date" className="input-field" />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea {...register('notes')} placeholder="Additional details..." rows={2} className="input-field resize-none" />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Income" size="sm"
        footer={<><button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button><button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button></>}>
        <p className="text-gray-600 dark:text-gray-400">Are you sure you want to delete this income record?</p>
      </Modal>
    </Layout>
  );
};

export default IncomePage;
