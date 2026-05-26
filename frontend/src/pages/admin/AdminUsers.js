import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserX, UserCheck, Trash2, Key, Crown, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [premiumModal, setPremiumModal] = useState(null);
  const [premiumMonths, setPremiumMonths] = useState(12);
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, limit: 15, search, plan: planFilter });
      setUsers(data.users);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  }, [page, search, planFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBlock = async (id, isBlocked) => {
    setActionLoading(id + 'block');
    try {
      await adminAPI.blockUser(id);
      toast.success(isBlocked ? 'User unblocked.' : 'User blocked.');
      fetchUsers();
    } catch { toast.error('Action failed.'); }
    finally { setActionLoading(''); }
  };

  const resetPassword = async (id) => {
    setActionLoading(id + 'reset');
    try {
      await adminAPI.resetPassword(id);
      toast.success('Temporary password sent to user email.');
    } catch { toast.error('Failed to reset password.'); }
    finally { setActionLoading(''); }
  };

  const deleteUser = async () => {
    try {
      await adminAPI.deleteUser(deleteId);
      toast.success('User deleted.');
      setDeleteId(null);
      fetchUsers();
    } catch { toast.error('Failed to delete user.'); }
  };

  const activatePremium = async () => {
    setActionLoading('premium');
    try {
      await adminAPI.activatePremium(premiumModal._id, premiumMonths);
      toast.success(`Premium activated for ${premiumModal.name} (${premiumMonths} months).`);
      setPremiumModal(null);
      fetchUsers();
    } catch { toast.error('Failed to activate premium.'); }
    finally { setActionLoading(''); }
  };

  const deactivatePremium = async (id) => {
    setActionLoading(id + 'deact');
    try {
      await adminAPI.deactivatePremium(id);
      toast.success('Premium deactivated.');
      fetchUsers();
    } catch { toast.error('Failed.'); }
    finally { setActionLoading(''); }
  };

  return (
    <Layout title="User Management">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users by name or email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10" />
        </div>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="input-field min-w-[140px]">
          <option value="all">All Plans</option>
          <option value="free">Free Users</option>
          <option value="premium">Premium Users</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    {['User', 'Email', 'Plan', 'KYC', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {users.map((u, i) => (
                    <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${u.subscriptionPlan === 'premium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          {u.subscriptionPlan === 'premium' ? '👑 Premium' : 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          u.kycStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                          u.kycStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          u.kycStatus === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                          {u.kycStatus?.replace('_', ' ') || 'not submitted'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isBlocked ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                          {u.isBlocked ? '🚫 Blocked' : '✅ Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {/* Block/Unblock */}
                          <button onClick={() => toggleBlock(u._id, u.isBlocked)}
                            disabled={actionLoading === u._id + 'block'}
                            title={u.isBlocked ? 'Unblock user' : 'Block user'}
                            className={`p-1.5 rounded-lg transition-colors ${u.isBlocked ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30' : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}>
                            {actionLoading === u._id + 'block' ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" /> : u.isBlocked ? <UserCheck size={15} /> : <UserX size={15} />}
                          </button>
                          {/* Reset Password */}
                          <button onClick={() => resetPassword(u._id)}
                            disabled={actionLoading === u._id + 'reset'}
                            title="Reset password" className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                            {actionLoading === u._id + 'reset' ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" /> : <Key size={15} />}
                          </button>
                          {/* Premium Toggle */}
                          {u.subscriptionPlan === 'premium' ? (
                            <button onClick={() => deactivatePremium(u._id)}
                              disabled={actionLoading === u._id + 'deact'}
                              title="Deactivate Premium" className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                              <Crown size={15} />
                            </button>
                          ) : (
                            <button onClick={() => { setPremiumModal(u); setPremiumMonths(12); }}
                              title="Activate Premium" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                              <Crown size={15} />
                            </button>
                          )}
                          {/* Delete */}
                          <button onClick={() => setDeleteId(u._id)}
                            title="Delete user" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 size={15} />
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <Search size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No users found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User" size="sm"
        footer={<><button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button><button onClick={deleteUser} className="btn-danger">Delete User</button></>}>
        <p className="text-gray-600 dark:text-gray-400">This will permanently delete the user and all their data. This cannot be undone.</p>
      </Modal>

      {/* Activate Premium Modal */}
      <Modal isOpen={!!premiumModal} onClose={() => setPremiumModal(null)} title="Activate Premium"
        footer={
          <>
            <button onClick={() => setPremiumModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={activatePremium} disabled={actionLoading === 'premium'} className="btn-primary">
              {actionLoading === 'premium' ? 'Activating...' : 'Activate Premium'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Activate Premium for <strong>{premiumModal?.name}</strong>:</p>
          <div>
            <label className="label">Duration</label>
            <select value={premiumMonths} onChange={e => setPremiumMonths(Number(e.target.value))} className="input-field">
              <option value={1}>1 Month</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months (1 Year)</option>
              <option value={24}>24 Months (2 Years)</option>
            </select>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
            ⚠️ This grants premium access manually without payment verification. Use only for testing or manual payments.
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminUsers;
