import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected');
        newSocket.emit('join', user._id);
      });

      // Listen for events
      newSocket.on('new_notification', ({ notification }) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast(notification.message, { icon: '🔔', duration: 4000 });
      });

      newSocket.on('budget_exceeded', ({ category, totalSpent, limit }) => {
        toast.error(`⚠️ Budget exceeded! ${category}: रु ${totalSpent.toFixed(0)} / रु ${limit}`, { duration: 5000 });
      });

      newSocket.on('premium_activated', ({ message }) => {
        toast.success(`🎉 ${message}`, { duration: 5000 });
      });

      newSocket.on('kyc_approved', ({ message }) => {
        toast.success(`✅ ${message}`, { duration: 5000 });
      });

      newSocket.on('kyc_rejected', ({ message, reason }) => {
        toast.error(`❌ ${message}: ${reason}`, { duration: 6000 });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, setUnreadCount, addNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
