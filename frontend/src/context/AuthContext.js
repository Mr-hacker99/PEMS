import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('pems_token'));

  // Set axios auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const { data } = await axios.get('/auth/me');
          if (data.success) {
            setUser(data.user);
          }
        } catch (error) {
          localStorage.removeItem('pems_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('pems_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await axios.post('/auth/register', { name, email, password });
    if (data.success) {
      localStorage.setItem('pems_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pems_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axios.get('/auth/me');
      if (data.success) setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const isPremium = useCallback(() => {
    if (!user) return false;
    if (user.subscriptionPlan !== 'premium') return false;
    if (!user.subscriptionExpiry) return false;
    return new Date() < new Date(user.subscriptionExpiry);
  }, [user]);

  const isAdmin = useCallback(() => user?.role === 'admin', [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, token,
      login, register, logout, updateUser, refreshUser,
      isPremium, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
