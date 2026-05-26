import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingDown, TrendingUp, Target, BarChart3,
  ScanLine, Bot, FileText, Bell, CreditCard, User, LogOut,
  Sun, Moon, Menu, X, Crown, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/expenses', icon: TrendingDown, label: 'Expenses' },
  { path: '/income', icon: TrendingUp, label: 'Income' },
  { path: '/budget', icon: Target, label: 'Budget' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ocr', icon: ScanLine, label: 'OCR Scanner', premium: true },
  { path: '/ai-assistant', icon: Bot, label: 'AI Assistant', premium: true },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { path: '/subscription', icon: CreditCard, label: 'Subscription' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: User, label: 'Users' },
  { path: '/admin/kyc', icon: Shield, label: 'KYC Management' },
  { path: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/admin/anomalies', icon: BarChart3, label: 'Anomaly Detection' },
  { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { user, logout, isPremium, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items = isAdmin() ? adminNavItems : navItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-5'} py-5 border-b border-gray-100 dark:border-gray-700`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white">PEMS</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">Expense Manager</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="mx-4 mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin() ? (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">Admin</span>
                ) : isPremium() ? (
                  <span className="badge-premium text-xs py-0.5"><Crown size={10} />Premium</span>
                ) : (
                  <span className="badge-free text-xs py-0.5">Free Plan</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        {items.map(({ path, icon: Icon, label, premium, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard' || path === '/admin'}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `${isActive ? 'sidebar-link-active' : 'sidebar-link'} relative`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{label}</span>
                {premium && !isPremium() && !isAdmin() && (
                  <Crown size={12} className="text-amber-400 flex-shrink-0" />
                )}
                {badge && unreadCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
            {collapsed && badge && unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`px-3 pb-4 mt-2 space-y-0.5 border-t border-gray-100 dark:border-gray-700 pt-3`}>
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full"
          title={collapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-50 lg:hidden overflow-y-auto"
            >
              {/* Mobile close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Top Header for mobile
export const TopHeader = ({ onMenuOpen, title }) => {
  const { unreadCount } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <button onClick={onMenuOpen} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
        <Menu size={20} />
      </button>
      <span className="font-semibold text-gray-900 dark:text-white">{title || 'PEMS'}</span>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Sidebar;
