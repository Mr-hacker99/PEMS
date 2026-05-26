import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import { notificationAPI } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  payment: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  kyc: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  budget: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  subscription: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
};

const TYPE_ICONS = {
  info: '💬', success: '✅', warning: '⚠️', error: '❌',
  payment: '💳', kyc: '🛡️', budget: '📊', subscription: '👑',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useSocket();

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { toast.error('Failed to load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch { toast.error('Failed.'); }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      const wasUnread = notifications.find(n => n._id === id && !n.isRead);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Failed to delete.'); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm py-2">
            <CheckCheck size={14} />Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map(notif => (
              <motion.div key={notif._id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`card flex items-start gap-4 transition-all duration-200 ${!notif.isRead ? 'border-l-4 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_STYLES[notif.type] || TYPE_STYLES.info}`}>
                  {TYPE_ICONS[notif.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">{formatRelativeTime(notif.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!notif.isRead && (
                    <button onClick={() => markRead(notif._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      title="Mark as read">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(notif._id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Bell size={56} className="text-gray-200 dark:text-gray-700 mb-4" />
          <p className="font-semibold text-gray-400 dark:text-gray-600 mb-1">No notifications yet</p>
          <p className="text-sm text-gray-300 dark:text-gray-700">You'll see budget alerts, KYC updates, and payment confirmations here.</p>
        </div>
      )}
    </Layout>
  );
};

export default NotificationsPage;
