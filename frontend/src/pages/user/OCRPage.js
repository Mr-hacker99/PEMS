import React, { useState, useRef } from 'react';
import { ScanLine, Upload, CheckCircle, Plus, Loader, Camera, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import PremiumGate from '../../components/common/PremiumGate';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatCurrency, CATEGORY_ICONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const OCRPage = () => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState(null);

  if (!isPremium()) {
    return (
      <Layout title="OCR Scanner">
        <h1 className="page-title mb-6">OCR Receipt Scanner</h1>
        <PremiumGate feature="OCR Receipt Scanner" />
      </Layout>
    );
  }

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setEditedData(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setEditedData(null);
    }
  };

  const handleScan = async () => {
    if (!image) { toast.error('Please select an image first.'); return; }
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('receiptImage', image);
      const { data } = await api.post('/ocr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setResult(data.data);
      setEditedData({
        title: data.data.extracted.shopName || 'Receipt Purchase',
        amount: data.data.extracted.amount || 0,
        category: data.data.extracted.category || 'Others',
        paymentMethod: data.data.extracted.paymentMethod || 'Cash',
        date: data.data.extracted.date || new Date().toISOString().split('T')[0],
        notes: `Scanned via OCR. Tax: रु ${data.data.extracted.taxAmount || 0}`,
      });
      toast.success('Receipt scanned successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scanning failed. Please try a clearer image.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!editedData) return;
    setSaving(true);
    try {
      await api.post('/expenses', { ...editedData, isOCRScanned: true });
      toast.success('Expense saved from receipt!');
      navigate('/expenses');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save expense.';
      if (err.response?.data?.requiresUpgrade) {
        toast.error('Expense limit reached. Upgrade to Premium.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setEditedData(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Layout title="OCR Scanner">
      <div className="mb-6">
        <h1 className="page-title">OCR Receipt Scanner</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Upload a receipt photo — AI automatically extracts amount, date, and category
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`card border-2 border-dashed transition-all duration-200 cursor-pointer min-h-[280px] flex flex-col items-center justify-center relative
              ${preview ? 'border-indigo-300 dark:border-indigo-700 p-0 overflow-hidden' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}`}
            onClick={() => !preview && fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              <>
                <img src={preview} alt="Receipt" className="w-full h-full object-contain max-h-[320px]" />
                <button onClick={(e) => { e.stopPropagation(); clearAll(); }}
                  className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera size={28} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Drop receipt image here</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">or click to browse</p>
                <div className="flex items-center gap-2 justify-center">
                  <Upload size={14} className="text-indigo-500" />
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Supports JPG, PNG, WEBP</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Max 5MB · Best results with clear, well-lit receipts</p>
              </div>
            )}
          </div>
          <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} className="hidden" />

          {/* Scan Button */}
          <button onClick={handleScan} disabled={!image || scanning}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            {scanning ? (
              <span className="flex items-center gap-2">
                <Loader size={18} className="animate-spin" />
                Scanning Receipt... (this may take 20-30s)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ScanLine size={18} />
                Scan Receipt with AI
              </span>
            )}
          </button>

          {/* How it works */}
          <div className="card bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
            <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3">🤖 How AI OCR Works</h3>
            <div className="space-y-2">
              {[
                '📸 Upload a clear photo of your receipt',
                '🔍 Tesseract.js AI reads the text from the image',
                '💡 Smart parser extracts amount, vendor, date',
                '🏷️ Category auto-detected from vendor type',
                '✅ Review & save directly as an expense',
              ].map((step, i) => (
                <p key={i} className="text-xs text-indigo-700 dark:text-indigo-400">{step}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {scanning && (
            <div className="card flex flex-col items-center justify-center py-12">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-pulse" />
                <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
                <ScanLine size={24} className="absolute inset-0 m-auto text-indigo-600" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Analyzing Receipt...</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">AI is reading and parsing the text</p>
            </div>
          )}

          {result && editedData && !scanning && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Confidence Badge */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                ${result.extracted.confidence === 'high'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                <CheckCircle size={16} />
                {result.extracted.confidence === 'high' ? 'High confidence extraction' : 'Low confidence — please verify values'}
              </div>

              {/* Extracted Data Editor */}
              <div className="card space-y-4">
                <h3 className="section-title">📋 Extracted Data — Review & Edit</h3>

                <div>
                  <label className="label">Vendor / Title</label>
                  <input type="text" value={editedData.title}
                    onChange={e => setEditedData(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Amount (NPR) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">रु</span>
                      <input type="number" step="0.01" value={editedData.amount}
                        onChange={e => setEditedData(prev => ({ ...prev, amount: e.target.value }))}
                        className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" value={editedData.date}
                      onChange={e => setEditedData(prev => ({ ...prev, date: e.target.value }))}
                      className="input-field" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select value={editedData.category}
                      onChange={e => setEditedData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field">
                      {['Food','Shopping','Bills','Healthcare','Transportation','Entertainment','Education','Others'].map(c => (
                        <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select value={editedData.paymentMethod}
                      onChange={e => setEditedData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="input-field">
                      {['Cash','Card','eSewa','Bank Transfer','Other'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea value={editedData.notes}
                    onChange={e => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2} className="input-field resize-none" />
                </div>

                {/* Raw OCR Text */}
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400">
                    View raw OCR text
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {result.rawText || 'No text extracted'}
                  </pre>
                </details>

                <div className="flex gap-3 pt-2">
                  <button onClick={clearAll} className="btn-secondary flex-1">
                    <X size={15} />Clear
                  </button>
                  <button onClick={handleSaveExpense} disabled={saving || !editedData.amount}
                    className="btn-primary flex-1 disabled:opacity-50">
                    {saving ? (
                      <span className="flex items-center gap-2"><Loader size={14} className="animate-spin" />Saving...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus size={14} />Save as Expense</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!result && !scanning && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <ScanLine size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="font-medium text-gray-400 dark:text-gray-600 mb-1">Scan result will appear here</p>
              <p className="text-sm text-gray-300 dark:text-gray-700">Upload a receipt and click "Scan Receipt"</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OCRPage;
