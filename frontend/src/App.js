import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// User Pages
import DashboardPage from './pages/user/DashboardPage';
import ExpensePage from './pages/user/ExpensePage';
import IncomePage from './pages/user/IncomePage';
import BudgetPage from './pages/user/BudgetPage';
import AnalyticsPage from './pages/user/AnalyticsPage';
import OCRPage from './pages/user/OCRPage';
import AIAssistantPage from './pages/user/AIAssistantPage';
import ReportsPage from './pages/user/ReportsPage';
import NotificationsPage from './pages/user/NotificationsPage';
import SubscriptionPage from './pages/user/SubscriptionPage';
import ProfilePage from './pages/user/ProfilePage';
import KYCPage from './pages/user/KYCPage';
import PaymentSuccessPage from './pages/user/PaymentSuccessPage';
import PaymentFailurePage from './pages/user/PaymentFailurePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminKYC from './pages/admin/AdminKYC';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminAnomalies from './pages/admin/AdminAnomalies';
import AdminNotifications from './pages/admin/AdminNotifications';

import LoadingSpinner from './components/common/LoadingSpinner';

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
      <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/ocr" element={<ProtectedRoute><OCRPage /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
      <Route path="/payment/failure" element={<ProtectedRoute><PaymentFailurePage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/kyc" element={<ProtectedRoute adminOnly><AdminKYC /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute adminOnly><AdminSubscriptions /></ProtectedRoute>} />
      <Route path="/admin/anomalies" element={<ProtectedRoute adminOnly><AdminAnomalies /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><AdminNotifications /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: { background: '#1f2937', color: '#f9fafb', borderRadius: '8px' },
                  success: { style: { background: '#065f46', color: '#fff' } },
                  error: { style: { background: '#7f1d1d', color: '#fff' } },
                }}
              />
              <AppRoutes />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
