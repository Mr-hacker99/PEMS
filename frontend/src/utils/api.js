import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pems_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pems_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  add: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getStats: () => api.get('/expenses/stats'),
};

// Income API
export const incomeAPI = {
  getAll: (params) => api.get('/incomes', { params }),
  add: (data) => api.post('/incomes', data),
  update: (id, data) => api.put(`/incomes/${id}`, data),
  delete: (id) => api.delete(`/incomes/${id}`),
  getStats: () => api.get('/incomes/stats'),
};

// Budget API
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  set: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// KYC API
export const kycAPI = {
  submit: (formData) => api.post('/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: () => api.get('/kyc/my'),
};

// Payment API
export const paymentAPI = {
  initiate: () => api.post('/payment/initiate'),
  getHistory: () => api.get('/payment/history'),
};

// AI API
export const aiAPI = {
  getAnalysis: () => api.get('/ai/analysis'),
  getForecast: () => api.get('/ai/forecast'),
  chat: (message) => api.post('/ai/chat', { message }),
};

// OCR API
export const ocrAPI = {
  scan: (formData) => api.post('/ocr/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // OCR takes longer
  }),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  blockUser: (id) => api.put(`/admin/users/${id}/block`),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  activatePremium: (userId, months) => api.put(`/admin/subscription/${userId}/activate`, { months }),
  deactivatePremium: (userId) => api.put(`/admin/subscription/${userId}/deactivate`),
  getKYC: (params) => api.get('/admin/kyc', { params }),
  approveKYC: (id) => api.put(`/admin/kyc/${id}/approve`),
  rejectKYC: (id, reason) => api.put(`/admin/kyc/${id}/reject`, { reason }),
  getAnomalies: () => api.get('/admin/anomalies'),
  sendNotification: (data) => api.post('/admin/notifications', data),
  getNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },
};
