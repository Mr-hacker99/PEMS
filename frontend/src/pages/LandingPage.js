import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Shield, Brain, ScanLine, FileText, Bell,
  TrendingUp, Check, Star, ChevronDown, Moon, Sun,
  Crown, ArrowRight, Wallet, Target, PieChart
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [faq, setFaq] = useState(null);

  const features = [
    { icon: Wallet, title: 'Expense & Income Tracking', desc: 'Log every rupee. Track expenses by category with notes, receipts, and payment methods.', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
    { icon: Brain, title: 'AI Financial Assistant', desc: 'Get personalized insights, spending analysis, and smart recommendations powered by AI.', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', premium: true },
    { icon: ScanLine, title: 'OCR Receipt Scanner', desc: 'Snap a photo of any receipt. Our AI auto-extracts amount, date, category, and vendor.', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', premium: true },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Beautiful charts showing spending trends, category breakdowns, monthly comparisons.', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { icon: Target, title: 'Budget Monitoring', desc: 'Set category-wise budgets. Get real-time alerts when you\'re close to limits.', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { icon: FileText, title: 'PDF & CSV Reports', desc: 'Generate detailed financial reports. Download in PDF or CSV format.', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', premium: true },
    { icon: Shield, title: 'KYC Verification', desc: 'Secure identity verification with citizenship document upload and admin review.', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
    { icon: Bell, title: 'Real-Time Notifications', desc: 'Instant alerts via Socket.IO for budget exceeded, payment done, KYC updates.', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  ];

  const testimonials = [
    { name: 'Sushant Poudel', role: 'Software Engineer, Bhairahawa', text: 'PEMS completely changed how I manage my salary. The AI analysis showed I was spending 40% on food!', avatar: 'R', plan: 'Premium' },
    { name: 'Shishir Maharjan', role: 'Business Owner, Bhairahawa', text: 'The OCR scanner is amazing. I just photo my receipts and everything gets logged automatically.', avatar: 'P', plan: 'Premium' },
    { name: 'Sushil Panthi', role: 'Student, Butwal', text: 'Free plan is perfect for me as a student. Budget monitoring helped me save for my laptop in 3 months!', avatar: 'B', plan: 'Free' },
  ];

  const faqs = [
    { q: 'Is PEMS free to use?', a: 'Yes! PEMS offers a free plan with up to 20 expenses and basic analytics. Upgrade to Premium for रु 999/year for unlimited features.' },
    { q: 'How does the OCR scanner work?', a: 'Upload a photo of any receipt. Our AI (Tesseract.js) scans the text and automatically extracts the amount, vendor name, date, and suggests a category.' },
    { q: 'Is my financial data safe?', a: 'Absolutely. We use JWT authentication, bcrypt password hashing, and encrypted storage. Your KYC documents are stored securely.' },
    { q: 'What payment methods does eSewa accept?', a: 'eSewa accepts all Nepali bank accounts, debit/credit cards, and mobile banking for the NPR 999/year subscription.' },
    { q: 'Can I cancel my Premium subscription?', a: 'Your Premium access remains active until the expiry date. You can choose not to renew, after which the account returns to Free plan.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold">P</span>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">PEMS</span>
                <p className="text-xs text-gray-400 -mt-1 hidden sm:block">Personal Expense Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 transition-colors">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-4">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Crown size={14} />  Personal Finance App
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Take Control of Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Financial Future</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track expenses, manage budgets, scan receipts with AI OCR, and get intelligent financial insights — all in Nepali Rupees (NPR).
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
              Start for Free <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary text-base px-8 py-3.5 w-full sm:w-auto">
              Sign In
            </button>
          </motion.div>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="text-sm text-gray-400 dark:text-gray-500 mt-4">
            No credit card required • Free forever plan available • eSewa payment
          </motion.p>

          {/* Hero Stats */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16">
            {[['रु 0', 'Setup Cost'], ['20+', 'Free Expenses'], ['AI', 'Powered']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{val}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Manage Finances
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From basic expense logging to AI-powered insights, PEMS has all tools for smart financial management.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
                className="card-hover relative group">
                {f.premium && (
                  <span className="absolute top-4 right-4 badge-premium"><Crown size={10} />Premium</span>
                )}
                <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 dark:text-gray-400">Start free. Upgrade when you need more power.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className="card border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Free Plan</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">रु 0</span>
                <span className="text-gray-500 dark:text-gray-400">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Up to 20 expenses', 'Basic income tracking', 'Basic analytics dashboard', 'Budget monitoring', 'Email support'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />{item}
                  </li>
                ))}
                {['OCR Receipt Scanner', 'AI Financial Assistant', 'PDF/CSV Reports', 'Advanced analytics'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-400 dark:text-gray-600 line-through">
                    <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')} className="btn-secondary w-full">
                Get Started Free
              </button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              className="card border-2 border-indigo-500 relative overflow-hidden shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
              <div className="absolute top-4 right-4">
                <span className="badge-premium"><Crown size={12} />Most Popular</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Premium Annual</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Unlimited power, full features</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">रु 999</span>
                <span className="text-gray-500 dark:text-gray-400">/year</span>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Less than रु 84/month!</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited expenses & income',
                  'AI Financial Assistant',
                  'OCR Receipt Scanner',
                  'Full analytics dashboard',
                  'PDF & CSV report downloads',
                  'Budget alerts & monitoring',
                  'Financial forecasting',
                  'Priority support',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={16} className="text-indigo-500 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')} className="btn-primary w-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                <Crown size={16} /> Get Premium — रु 999/year
              </button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">Pay via eSewa · Instant activation</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Loved by Nepali Users</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
                className="card-hover">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                  {t.plan === 'Premium' && <span className="ml-auto badge-premium text-xs"><Crown size={10} /></span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.3}
                className="card cursor-pointer" onClick={() => setFaq(faq === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{item.q}</h4>
                  <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 ml-4 transition-transform duration-200 ${faq === i ? 'rotate-180' : ''}`} />
                </div>
                {faq === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                    {item.a}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-600 to-purple-700">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Your Financial Journey Today</h2>
          <p className="text-indigo-200 mb-8">Join thousands of Nepalis taking control of their money with PEMS.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg">
              Create Free Account <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-all duration-200 w-full sm:w-auto justify-center flex items-center gap-2">
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-white">PEMS</span>
              <span className="text-gray-600 text-sm">— Personal Expense Management System</span>
            </div>
            {/* <div className="flex items-center gap-6 text-sm">
              <span>Final Year College Project</span>
              <span>Built with MERN Stack</span>
              <span>© 2025 PEMS</span>
            </div> */}
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">
            © 2026 PEMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
