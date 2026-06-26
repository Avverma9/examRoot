import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, logout, setUser } from '../store/slices/authSlice';
import { fetchSubscriptions } from '../store/slices/paymentSlice';
import { getCurrentUser } from '../services/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch        = useDispatch();
  const auth            = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const token   = await AsyncStorage.getItem('authToken');
        const userStr = await AsyncStorage.getItem('user');

        if (!token) {
          // No token → not logged in
          setIsInitialized(true);
          return;
        }

        // Token exists → validate it against server
        try {
          const res = await getCurrentUser(token);

          if (res.success && res.user) {
            // Token valid → restore session with fresh server data
            await AsyncStorage.setItem('user', JSON.stringify(res.user));
            dispatch(initializeAuth({ token, user: res.user }));
            dispatch(fetchSubscriptions(token));
          } else {
            // Server rejected token → clear storage
            await AsyncStorage.multiRemove(['authToken', 'user']);
            dispatch(logout());
          }
        } catch (networkErr) {
          // Network error (offline) → use cached data if available
          console.warn('Token validation failed (network):', networkErr.message);
          if (userStr) {
            const cachedUser = JSON.parse(userStr);
            dispatch(initializeAuth({ token, user: cachedUser }));
            dispatch(fetchSubscriptions(token));
          } else {
            // No cached user either → clear
            await AsyncStorage.multiRemove(['authToken', 'user']);
            dispatch(logout());
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        // On unexpected error → clear and force login
        await AsyncStorage.multiRemove(['authToken', 'user']);
        dispatch(logout());
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [dispatch]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'user']);
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    ...auth,
    isInitialized,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
