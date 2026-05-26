import React, { useState, useEffect } from 'react';
import { Crown, Check, AlertTriangle, CreditCard, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../utils/api';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { WhateverYouActuallyUse } from "lucide-react";

const SubscriptionPage = () => {
  const { user, isPremium, refreshUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    paymentAPI.getHistory().then(({ data }) => setHistory(data.subscriptions || [])).catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setInitiating(true);
    try {
      const { data } = await paymentAPI.initiate();
      if (!data.success) {
        toast.error('Failed to initiate payment.');
        return;
      }
      const { esewaData, esewaUrl } = data;

      // Create and submit eSewa form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = esewaUrl;
      form.style.display = 'none';

      Object.entries(esewaData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      toast('Redirecting to eSewa payment...', { icon: '💳' });
      setTimeout(() => { form.submit(); document.body.removeChild(form); }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed.');
    } finally {
      setInitiating(false);
    }
  };

  const daysLeft = getDaysUntilExpiry(user?.subscriptionExpiry);
  const isActive = isPremium();

  return (
    <Layout title="Subscription">
      <div className="mb-6">
        <h1 className="page-title">Subscription & Billing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your PEMS subscription plan</p>
      </div>

      {/* Current Plan Status */}
      <div className={`card mb-6 ${isActive ? 'border-2 border-amber-300 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? 'gradient-premium' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Crown size={24} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {isActive ? 'Premium Annual Plan' : 'Free Plan'}
                </p>
                {isActive && <span className="badge-premium text-xs"><Crown size={10} />Active</span>}
              </div>
              {isActive ? (
                <div className="space-y-0.5">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock size={13} />
                    Expires: {formatDate(user?.subscriptionExpiry)}
                  </p>
                  <p className={`text-sm font-medium ${daysLeft <= 30 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {daysLeft} days remaining
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">20 expenses · Basic analytics · Limited features</p>
              )}
            </div>
          </div>
          {isActive && daysLeft <= 60 && (
            <button onClick={handleUpgrade} disabled={initiating} className="btn-primary">
              <Crown size={15} />
              {daysLeft <= 30 ? '⚠️ Renew Now' : 'Renew Plan'}
            </button>
          )}
        </div>

        {isActive && daysLeft <= 30 && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Your subscription expires in <strong>{daysLeft} days</strong>. Renew to avoid losing premium access.
            </p>
          </div>
        )}
      </div>

      {/* Plans Comparison */}
      {!isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 max-w-3xl">
          {/* Free */}
          <div className="card border-2 border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Free Plan</h3>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">रु 0<span className="text-base font-normal text-gray-400">/forever</span></p>
            <ul className="space-y-2.5 mb-6">
              {['20 expenses limit', 'Basic income tracking', 'Basic dashboard', 'Budget monitoring', 'Email support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check size={14} className="text-emerald-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <div className="btn-secondary w-full justify-center opacity-60 cursor-not-allowed">Current Plan</div>
          </div>

          {/* Premium */}
          <div className="card border-2 border-indigo-500 relative shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="badge-premium px-3 py-1 text-xs"><Crown size={10} />Recommended</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Premium Annual</h3>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">रु 999<span className="text-base font-normal text-gray-400">/year</span></p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-4">≈ रु 83/month only!</p>
            <ul className="space-y-2.5 mb-6">
              {[
                'Unlimited expenses & income', 'AI Financial Assistant', 'OCR Receipt Scanner',
                'Full analytics dashboard', 'PDF & CSV downloads', 'Advanced charts',
                'Financial forecasting', 'Priority support',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check size={14} className="text-indigo-500 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgrade} disabled={initiating}
              className="btn-primary w-full py-3 text-base shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
              {initiating ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting...</span>
              ) : (
                <span className="flex items-center gap-2"><CreditCard size={16} />Pay via eSewa — रु 999</span>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center justify-center gap-1">
              <Shield size={11} />Secured by eSewa · Instant activation
            </p>
          </div>
        </div>
      )}

      {/* eSewa Info */}
      <div className="card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900 mb-6 max-w-3xl">
        <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
          <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-5" onError={e => e.target.style.display='none'} />
          eSewa Payment — Nepal's #1 Digital Wallet
        </h3>
        <p className="text-sm text-green-700 dark:text-green-400">
          PEMS uses eSewa's secure payment gateway for subscriptions. After payment, your account is upgraded instantly.
          Accepted: eSewa wallet, bank cards, mobile banking via eSewa.
        </p>
      </div>

      {/* Payment History */}
      {history.length > 0 && (
        <div className="card max-w-3xl">
          <h2 className="section-title mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="text-center py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {history.map((sub, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(sub.createdAt)}</td>
                    <td className="py-3 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{sub.plan}</td>
                    <td className="py-3 text-right text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(sub.amount)}</td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        sub.paymentStatus === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        sub.paymentStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                        {sub.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-400 dark:text-gray-500 font-mono hidden sm:table-cell truncate max-w-[150px]">
                      {sub.transactionId}
                    </td>
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

export default SubscriptionPage;
