import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const demoUsers = [
    { label: 'Free User', email: 'ram@gmail.com', password: 'Ram@123', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    { label: 'Premium', email: 'sita@gmail.com', password: 'Sita@123', color: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' },
    { label: 'Expired', email: 'hari@gmail.com', password: 'Hari@123', color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
    { label: 'Admin', email: 'admin@gmail.com', password: 'Admin@123', color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' },
  ];

  const fillDemo = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
        navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PEMS</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to your expense manager</p>
          </div>

          {/* Demo User Quick Access */}
          {/* <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button key={u.email} onClick={() => fillDemo(u.email, u.password)}
                  className={`${u.color} text-xs font-medium py-2 px-3 rounded-lg hover:opacity-80 transition-opacity text-left`}>
                  <span className="block font-semibold">{u.label}</span>
                  <span className="opacity-70">{u.email}</span>
                </button>
              ))}
            </div>
          </div> */}

          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                  type="email" placeholder="your@email.com"
                  className="input-field pl-10" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
              ) : (
                <span className="flex items-center gap-2">Sign In <ArrowRight size={16} /></span>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Create account</Link>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }} />
          ))}
        </div>
        <div className="text-white text-center relative z-10 max-w-sm">
          <div className="text-7xl mb-6">💰</div>
          <h2 className="text-3xl font-bold mb-4">Smart Money Management</h2>
          <p className="text-indigo-200 leading-relaxed">
            Track every rupee, set smart budgets, and get AI-powered insights to achieve your financial goals faster.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[['OCR Scanner', '📷'], ['AI Assistant', '🤖'], ['Analytics', '📊'], ['eSewa Pay', '💳']].map(([label, icon]) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <span className="text-2xl">{icon}</span>
                <p className="text-xs text-indigo-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
