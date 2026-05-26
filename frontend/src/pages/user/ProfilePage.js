import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Shield, Camera, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api, { kycAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// ==================== PROFILE PAGE ====================
export const ProfilePage = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regPass, handleSubmit: handlePass, reset: resetPass, watch, formState: { errors: passErrors } } = useForm();
  const newPass = watch('newPassword');

  useEffect(() => {
    if (user) reset({ name: user.name, themePreference: user.themePreference });
  }, [user, reset]);

  const onProfileSave = async (data) => {
    setSaving(true);
    try {
      const { data: res } = await api.put('/auth/profile', data);
      if (res.success) {
        updateUser({ name: data.name, themePreference: data.themePreference });
        toast.success('Profile updated!');
      }
    } catch { toast.error('Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const onPasswordChange = async (data) => {
    setChangingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      resetPass();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
    finally { setChangingPass(false); }
  };

  const KYC_STATUS = {
    not_submitted: { label: 'Not Submitted', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: Clock },
    pending: { label: 'Pending Review', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
    approved: { label: 'Verified ✓', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  };
  const kycInfo = KYC_STATUS[user?.kycStatus || 'not_submitted'];

  return (
    <Layout title="Profile">
      <div className="mb-6">
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${kycInfo.bg} ${kycInfo.color}`}>
                <kycInfo.icon size={11} />{kycInfo.label}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user?.subscriptionPlan === 'premium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                {user?.subscriptionPlan === 'premium' ? '👑 Premium' : 'Free Plan'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-5">
          <h3 className="section-title">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('name', { required: 'Name required' })} className="input-field" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input value={user?.email || ''} disabled className="input-field opacity-50 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="label">Theme Preference</label>
            <select {...register('themePreference')} className="input-field max-w-xs">
              <option value="light">☀️ Light Mode</option>
              <option value="dark">🌙 Dark Mode</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card mb-6">
        <h3 className="section-title mb-4">Change Password</h3>
        <form onSubmit={handlePass(onPasswordChange)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...regPass('currentPassword', { required: 'Required' })} type="password" className="input-field max-w-sm" />
            {passErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{passErrors.currentPassword.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="label">New Password</label>
              <input {...regPass('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} type="password" className="input-field" />
              {passErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input {...regPass('confirmNew', { required: 'Required', validate: v => v === newPass || 'Passwords do not match' })} type="password" className="input-field" />
              {passErrors.confirmNew && <p className="text-xs text-red-500 mt-1">{passErrors.confirmNew.message}</p>}
            </div>
          </div>
          <button type="submit" disabled={changingPass} className="btn-secondary">
            {changingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Account Details */}
      <div className="card">
        <h3 className="section-title mb-4">Account Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Member Since', value: formatDate(user?.createdAt) },
            { label: 'Email Verified', value: user?.isEmailVerified ? '✅ Verified' : '❌ Not verified' },
            { label: 'KYC Status', value: kycInfo.label },
            { label: 'Role', value: user?.role === 'admin' ? '👤 Admin' : '👤 User' },
            { label: 'Subscription', value: user?.subscriptionPlan === 'premium' ? '👑 Premium' : '🆓 Free' },
            { label: 'Expiry', value: user?.subscriptionExpiry ? formatDate(user.subscriptionExpiry) : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

// ==================== KYC PAGE ====================
export const KYCPage = () => {
  const { user, refreshUser } = useAuth();
  const [myKYC, setMyKYC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState({ profileImage: null, citizenshipFrontImage: null, citizenshipBackImage: null });
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    kycAPI.getMy().then(({ data }) => { setMyKYC(data.kyc); }).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    if (!files.profileImage || !files.citizenshipFrontImage || !files.citizenshipBackImage) {
      toast.error('Please upload all required images.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) formData.append(k, v); });
      await kycAPI.submit(formData);
      toast.success('KYC submitted! Pending admin review.');
      await refreshUser();
      const { data: kycRes } = await kycAPI.getMy();
      setMyKYC(kycRes.kyc);
    } catch (err) { toast.error(err.response?.data?.message || 'KYC submission failed.'); }
    finally { setSubmitting(false); }
  };

  const StatusBanner = () => {
    if (!myKYC) return null;
    const statusConfig = {
      pending: { bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: '⏳', title: 'KYC Pending Review', msg: 'Your KYC documents are being reviewed by our admin team. You\'ll be notified via email once approved.' },
      approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: '✅', title: 'KYC Approved!', msg: 'Your identity is verified. You have a verified badge on your account.' },
      rejected: { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: '❌', title: 'KYC Rejected', msg: `Reason: ${myKYC.rejectionReason || 'Documents were unclear or invalid.'}` },
    };
    const cfg = statusConfig[myKYC.verificationStatus];
    if (!cfg) return null;
    return (
      <div className={`card border ${cfg.bg} mb-6`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{cfg.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cfg.msg}</p>
            {myKYC.verificationStatus === 'rejected' && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 font-medium">You can resubmit your KYC below.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FileField = ({ name, label }) => (
    <div>
      <label className="label">{label} *</label>
      <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
        ${files[name] ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
        onClick={() => document.getElementById(`file-${name}`).click()}>
        {files[name] ? (
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">{files[name].name}</span>
          </div>
        ) : (
          <div className="text-gray-400 dark:text-gray-600">
            <Upload size={20} className="mx-auto mb-1" />
            <p className="text-xs">Click to upload {label.toLowerCase()}</p>
          </div>
        )}
        <input id={`file-${name}`} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files[0]) setFiles(prev => ({ ...prev, [name]: e.target.files[0] })); }} />
      </div>
    </div>
  );

  if (loading) return <Layout title="KYC"><div className="text-center py-10">Loading...</div></Layout>;
  if (myKYC?.verificationStatus === 'approved') {
    return (
      <Layout title="KYC Verification">
        <h1 className="page-title mb-6">KYC Verification</h1>
        <StatusBanner />
        <div className="card max-w-md">
          <h3 className="section-title mb-3">Your KYC Details</h3>
          {[['Full Name', myKYC.fullName], ['Phone', myKYC.phone], ['Address', myKYC.address], ['Citizenship #', myKYC.citizenshipNumber]].map(([k,v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">{k}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{v}</span>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="KYC Verification">
      <div className="mb-6">
        <h1 className="page-title">KYC Verification</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Complete identity verification to get your verified badge</p>
      </div>
      <StatusBanner />
      {(myKYC?.verificationStatus !== 'approved') && (
        <div className="card max-w-2xl">
          <div className="flex items-center gap-2 mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Shield size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">Your documents are encrypted and stored securely. Only admin can view them for verification.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input {...register('fullName', { required: 'Required' })} placeholder="As per citizenship" className="input-field" />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input {...register('phone', { required: 'Required', pattern: { value: /^[0-9+]{10,13}$/, message: 'Invalid phone' } })} placeholder="+977-98XXXXXXXX" className="input-field" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">Address *</label>
              <input {...register('address', { required: 'Required' })} placeholder="Full address" className="input-field" />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="label">Citizenship Number *</label>
              <input {...register('citizenshipNumber', { required: 'Required' })} placeholder="e.g., 01-01-78-12345" className="input-field" />
              {errors.citizenshipNumber && <p className="text-xs text-red-500 mt-1">{errors.citizenshipNumber.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FileField name="profileImage" label="Profile Photo" />
              <FileField name="citizenshipFrontImage" label="Citizenship Front" />
              <FileField name="citizenshipBackImage" label="Citizenship Back" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</span>
              ) : 'Submit KYC Verification'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
};

// ==================== PAYMENT SUCCESS ====================
export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');
        if (data) {
          await api.get(`/payment/success?data=${encodeURIComponent(data)}`);
          await refreshUser();
          toast.success('Premium subscription activated! 🎉');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
      }
      setProcessed(true);
    };
    verifyPayment();
  }, [refreshUser]);

  return (
    <Layout title="Payment Success">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful! 🎉</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Your Premium subscription is now active. Enjoy unlimited expenses, AI analytics, OCR scanning, and all premium features!
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-8 py-3">Go to Dashboard</button>
          <button onClick={() => navigate('/ai-assistant')} className="btn-secondary px-8 py-3">Try AI Assistant</button>
        </div>
      </div>
    </Layout>
  );
};



// ==================== PAYMENT FAILURE ====================
export const PaymentFailurePage = () => {
  const navigate = useNavigate();
  return (
    <Layout title="Payment Failed">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Your payment was not completed or was cancelled. No charges were made. Please try again.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/subscription')} className="btn-primary px-8 py-3">Try Again</button>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary px-8 py-3">Back to Dashboard</button>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
