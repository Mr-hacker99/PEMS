import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminAPI } from '../../utils/api';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminKYC = () => {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewKYC, setViewKYC] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchKYC = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getKYC({ status: statusFilter, page, limit: 12 });
      setKycs(data.kycs);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load KYC requests.'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchKYC(); }, [fetchKYC]);

  const approveKYC = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveKYC(id);
      toast.success('KYC approved! User notified.');
      setViewKYC(null);
      fetchKYC();
    } catch { toast.error('Failed to approve KYC.'); }
    finally { setActionLoading(''); }
  };

  const rejectKYC = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    setActionLoading('reject');
    try {
      await adminAPI.rejectKYC(rejectModal._id, rejectReason);
      toast.success('KYC rejected. User notified with reason.');
      setRejectModal(null);
      setRejectReason('');
      setViewKYC(null);
      fetchKYC();
    } catch { toast.error('Failed to reject KYC.'); }
    finally { setActionLoading(''); }
  };

  const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    const icons = { pending: '⏳', approved: '✅', rejected: '❌' };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || ''}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <Layout title="KYC Management">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">KYC Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} KYC submissions</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-5 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl w-fit">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${statusFilter === status ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {status}
          </button>
        ))}
      </div>

      {/* KYC Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : kycs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
            {kycs.map((kyc, i) => (
              <motion.div key={kyc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {kyc.profileImage ? (
                      <img src={`${API_URL}${kyc.profileImage}`} alt={kyc.fullName}
                        className="w-11 h-11 rounded-xl object-cover border-2 border-gray-100 dark:border-gray-700"
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        {kyc.fullName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{kyc.fullName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{kyc.userId?.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={kyc.verificationStatus} />
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between"><span>Phone:</span><span className="font-medium text-gray-700 dark:text-gray-300">{kyc.phone}</span></div>
                  <div className="flex justify-between"><span>Citizenship #:</span><span className="font-medium text-gray-700 dark:text-gray-300">{kyc.citizenshipNumber}</span></div>
                  <div className="flex justify-between"><span>Submitted:</span><span>{formatRelativeTime(kyc.createdAt)}</span></div>
                  {kyc.verificationStatus === 'rejected' && kyc.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-red-600 dark:text-red-400">Rejection: {kyc.rejectionReason}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setViewKYC(kyc)} className="btn-secondary flex-1 text-xs py-2">
                    <Eye size={13} />View Docs
                  </button>
                  {kyc.verificationStatus === 'pending' && (
                    <>
                      <button onClick={() => approveKYC(kyc._id)} disabled={actionLoading === kyc._id}
                        className="btn-success flex-1 text-xs py-2">
                        {actionLoading === kyc._id ? '...' : <><CheckCircle size={13} />Approve</>}
                      </button>
                      <button onClick={() => { setRejectModal(kyc); setRejectReason(''); }}
                        className="btn-danger flex-1 text-xs py-2">
                        <XCircle size={13} />Reject
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.ceil(total / 12)}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 12 >= total} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
          <Shield size={48} className="mb-3 opacity-30" />
          <p className="font-medium">No {statusFilter !== 'all' ? statusFilter : ''} KYC submissions</p>
        </div>
      )}

      {/* View KYC Documents Modal */}
      <Modal isOpen={!!viewKYC} onClose={() => setViewKYC(null)} title="KYC Documents Review" size="lg"
        footer={
          viewKYC?.verificationStatus === 'pending' ? (
            <>
              <button onClick={() => setViewKYC(null)} className="btn-secondary">Close</button>
              <button onClick={() => { setRejectModal(viewKYC); setRejectReason(''); setViewKYC(null); }} className="btn-danger">
                <XCircle size={15} />Reject
              </button>
              <button onClick={() => approveKYC(viewKYC._id)} disabled={actionLoading === viewKYC?._id} className="btn-success">
                {actionLoading === viewKYC?._id ? 'Approving...' : <><CheckCircle size={15} />Approve KYC</>}
              </button>
            </>
          ) : (
            <button onClick={() => setViewKYC(null)} className="btn-secondary">Close</button>
          )
        }>
        {viewKYC && (
          <div className="space-y-5">
            {/* Personal Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Full Name', viewKYC.fullName], ['Phone', viewKYC.phone],
                  ['Address', viewKYC.address], ['Citizenship #', viewKYC.citizenshipNumber],
                  ['Status', viewKYC.verificationStatus], ['Submitted', formatDate(viewKYC.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{k}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Images */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Document Images</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Profile Photo', viewKYC.profileImage],
                  ['Citizenship Front', viewKYC.citizenshipFrontImage],
                  ['Citizenship Back', viewKYC.citizenshipBackImage],
                ].map(([label, src]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
                    {src ? (
                      <a href={`${API_URL}${src}`} target="_blank" rel="noopener noreferrer">
                        <img src={`${API_URL}${src}`} alt={label}
                          className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                          onError={e => { e.target.src = ''; e.target.alt = 'Image not available'; }} />
                      </a>
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {viewKYC.rejectionReason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400"><strong>Rejection reason:</strong> {viewKYC.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject KYC" size="sm"
        footer={
          <>
            <button onClick={() => setRejectModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={rejectKYC} disabled={actionLoading === 'reject' || !rejectReason.trim()} className="btn-danger disabled:opacity-50">
              {actionLoading === 'reject' ? 'Rejecting...' : 'Reject KYC'}
            </button>
          </>
        }>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Rejecting KYC for <strong>{rejectModal?.fullName}</strong>. Please provide a clear reason.
          </p>
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g., Image is blurry, incorrect document, name mismatch..."
              className="input-field resize-none" />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminKYC;
