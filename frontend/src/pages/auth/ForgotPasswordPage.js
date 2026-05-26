import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

// ==================== FORGOT PASSWORD ====================
export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await axios.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PEMS</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="card text-center">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Check Your Email!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              We've sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link to="/login" className="btn-primary w-full justify-center">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                  type="email" placeholder="your@email.com" className="input-field pl-10" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Remember it? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// ==================== RESET PASSWORD ====================
export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await axios.post(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose a strong password</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                type={showPass ? 'text' : 'password'} placeholder="New password" className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input {...register('confirmPassword', { required: 'Please confirm', validate: v => v === password || 'Passwords do not match' })}
                type="password" placeholder="Confirm password" className="input-field pl-10" />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ==================== VERIFY EMAIL ====================
export const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="card max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Your account is now verified. Redirecting to login...</p>
            <Link to="/login" className="btn-primary w-full justify-center">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Link is invalid or expired. Please request a new one.</p>
            <Link to="/login" className="btn-primary w-full justify-center">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
