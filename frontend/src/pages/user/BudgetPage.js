import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food','Shopping','Bills','Healthcare','Transportation','Entertainment','Education','Others'];

const BudgetPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budgets', { params: { month, year } });
      setBudgets(data.budgets);
    } catch { toast.error('Failed to load budgets.'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post('/budgets', { ...data, month, year });
      toast.success('Budget saved!');
      setModalOpen(false);
      reset();
      fetchBudgets();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget removed.');
      setDeleteId(null);
      fetchBudgets();
    } catch { toast.error('Failed.'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const overBudget = budgets.filter(b => (b.spent || 0) > b.limit);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <Layout title="Budget">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Budget Monitoring</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Set and track your spending limits</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input-field py-2 text-sm">
            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-field py-2 text-sm w-24">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => { reset({ category: 'Food' }); setModalOpen(true); }} className="btn-primary whitespace-nowrap">
            <Plus size={16} />Set Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Budget', value: formatCurrency(totalBudget), icon: '🎯', color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Total Spent', value: formatCurrency(totalSpent), icon: '💸', color: 'text-red-600 dark:text-red-400' },
          { label: 'Remaining', value: formatCurrency(Math.max(0, totalBudget - totalSpent)), icon: '💰', color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="card text-center py-5">
            <span className="text-3xl">{s.icon}</span>
            <p className={`text-xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Over Budget Warning */}
      {overBudget.length > 0 && (
        <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Budget Exceeded!</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {overBudget.map(b => b.category).join(', ')} exceeded their budget limits this month.
            </p>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((budget, i) => {
            const pct = Math.min(((budget.spent || 0) / budget.limit) * 100, 100);
            const isOver = (budget.spent || 0) > budget.limit;
            const color = isOver ? '#EF4444' : pct >= 80 ? '#F59E0B' : CATEGORY_COLORS[budget.category] || '#6366f1';
            return (
              <motion.div key={budget._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`card border-2 ${isOver ? 'border-red-200 dark:border-red-800' : pct >= 80 ? 'border-amber-200 dark:border-amber-800' : 'border-transparent'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{CATEGORY_ICONS[budget.category] || '📦'}</span>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{budget.category}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{months[month-1]} {year}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteId(budget._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Spent: <span className="font-bold" style={{ color }}>{formatCurrency(budget.spent || 0)}</span></span>
                  <span className="text-gray-500 dark:text-gray-400">Limit: <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(budget.limit)}</span></span>
                </div>

                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ backgroundColor: color }} />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium" style={{ color }}>{pct.toFixed(0)}% used</span>
                  {isOver ? (
                    <span className="text-xs font-medium text-red-500">Over by {formatCurrency((budget.spent || 0) - budget.limit)}</span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatCurrency(budget.remaining)} left</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Target size={48} className="text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No budgets set</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">Set category budgets to track your spending limits.</p>
          <button onClick={() => { reset({ category: 'Food' }); setModalOpen(true); }} className="btn-primary text-sm">
            <Plus size={14} />Set First Budget
          </button>
        </div>
      )}

      {/* Add Budget Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button form="budget-form" type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Budget'}
            </button>
          </>
        }
      >
        <form id="budget-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Category *</label>
            <select {...register('category', { required: true })} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monthly Limit (NPR) *</label>
            <input {...register('limit', { required: 'Limit is required', min: { value: 1, message: 'Must be > 0' } })}
              type="number" step="0.01" placeholder="e.g., 5000" className="input-field" />
            {errors.limit && <p className="text-xs text-red-500 mt-1">{errors.limit.message}</p>}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            Setting a budget for <strong>{months[month-1]} {year}</strong>. You'll receive alerts when spending approaches the limit.
          </p>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Budget" size="sm"
        footer={<><button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button><button onClick={() => handleDelete(deleteId)} className="btn-danger">Remove</button></>}>
        <p className="text-gray-600 dark:text-gray-400">Remove this budget limit? Your expenses won't be affected.</p>
      </Modal>
    </Layout>
  );
};

export default BudgetPage;
