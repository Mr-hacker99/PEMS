import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const PremiumGate = ({ children, feature = 'This feature' }) => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();

  if (isPremium()) return children;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-6"
    >
      <div className="w-20 h-20 gradient-premium rounded-full flex items-center justify-center mb-6 shadow-lg">
        <Lock size={32} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-sm">
        <strong>{feature}</strong> is available exclusively for Premium subscribers.
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 max-w-sm">
        Upgrade to Premium for रु 999/year and unlock unlimited expenses, AI analytics, OCR scanning, and much more.
      </p>
      <button
        onClick={() => navigate('/subscription')}
        className="btn-primary gradient-premium border-0 px-8 py-3 text-base"
      >
        <Crown size={18} />
        Upgrade to Premium — रु 999/year
      </button>
    </motion.div>
  );
};

export default PremiumGate;
