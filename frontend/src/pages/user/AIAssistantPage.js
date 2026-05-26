import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader, TrendingUp, TrendingDown, Brain, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import PremiumGate from '../../components/common/PremiumGate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { aiAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  'Analyze my spending habits',
  'How can I save more money?',
  'What is my highest expense category?',
  'Give me budgeting tips',
  'How is my financial health?',
  'What are my income trends?',
];

const AIAssistantPage = () => {
  const { isPremium } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm PEMS AI, your personal financial advisor. I've analyzed your expense data and I'm ready to help. Ask me anything about your finances!" }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!isPremium()) return;
    const fetchAnalysis = async () => {
      try {
        const { data } = await aiAPI.getAnalysis();
        setAnalysis(data);
      } catch { toast.error('Failed to load AI analysis.'); }
      finally { setLoadingAnalysis(false); }
    };
    fetchAnalysis();
  }, [isPremium]);

  if (!isPremium()) {
    return (
      <Layout title="AI Assistant">
        <h1 className="page-title mb-6">AI Financial Assistant</h1>
        <PremiumGate feature="AI Financial Assistant" />
      </Layout>
    );
  }

  const sendMessage = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setChatLoading(true);
    try {
      const { data } = await aiAPI.chat(text);
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process your request. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout title="AI Assistant">
      <div className="mb-6">
        <h1 className="page-title">AI Financial Assistant</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Powered by intelligent financial analysis</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Analysis Panel */}
        <div className="xl:col-span-1 space-y-4">
          {loadingAnalysis ? (
            <div className="card flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Analyzing your finances..." />
            </div>
          ) : analysis ? (
            <>
              {/* Financial Health Score */}
              <div className="card bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Brain size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Financial Health</p>
                    <p className="text-indigo-200 text-xs">AI Assessment</p>
                  </div>
                </div>
                <p className="text-sm text-indigo-100 leading-relaxed">{analysis.summary || 'Analysis complete.'}</p>
              </div>

              {/* Context Stats */}
              {analysis.context && (
                <div className="card space-y-3">
                  <h3 className="section-title">📊 Your Data</h3>
                  {[
                    { label: 'Total Income', value: formatCurrency(analysis.context.totalIncome), icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Total Expenses', value: formatCurrency(analysis.context.totalExpense), icon: TrendingDown, color: 'text-red-500' },
                    { label: 'Net Balance', value: formatCurrency(analysis.context.balance), icon: BarChart3, color: 'text-indigo-500' },
                    { label: 'Savings Rate', value: `${analysis.context.savingsRate}%`, icon: Brain, color: 'text-purple-500' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={color} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Insights */}
              {analysis.insights?.length > 0 && (
                <div className="card">
                  <h3 className="section-title mb-3">💡 Key Insights</h3>
                  <div className="space-y-2">
                    {analysis.insights.map((insight, i) => (
                      <p key={i} className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="card">
                  <h3 className="section-title mb-3">🎯 Recommendations</h3>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-indigo-500 mt-0.5 flex-shrink-0">→</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Analysis */}
              {analysis.analysis && (
                <div className="card">
                  <h3 className="section-title mb-3">📄 Full Report</h3>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed font-sans">
                    {analysis.analysis}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-8">
              <Brain size={40} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-600 text-sm">Analysis unavailable. Try adding some expenses first.</p>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="xl:col-span-2 card flex flex-col" style={{ height: '70vh', minHeight: 480 }}>
          {/* Chat Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 mb-4 flex-shrink-0">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">PEMS AI Assistant</p>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online · Ready to help
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {chatLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">AI is thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="flex gap-2 flex-wrap py-3 border-t border-gray-100 dark:border-gray-700 mt-2 flex-shrink-0">
            {QUICK_QUESTIONS.slice(0, 3).map(q => (
              <button key={q} onClick={() => sendMessage(q)} disabled={chatLoading}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 flex-shrink-0">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances... (Enter to send)"
              rows={1}
              disabled={chatLoading}
              className="input-field flex-1 resize-none py-2.5 min-h-[42px] max-h-28 overflow-y-auto"
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || chatLoading}
              className="btn-primary px-4 py-2.5 flex-shrink-0 disabled:opacity-50">
              {chatLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAssistantPage;
