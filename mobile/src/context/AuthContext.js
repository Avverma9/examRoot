import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, logout } from '../store/slices/authSlice';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth from storage on app load
    const initializeAuthFromStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userStr = await AsyncStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch(initializeAuth({ token, user }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuthFromStorage();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      dispatch(logout());
    } catch (error) {
      console.error('Error during logout:', error);
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
