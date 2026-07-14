import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { initializeAuth, logout } from '../store/slices/authSlice';
import { fetchSubscriptions } from '../store/slices/paymentSlice';
import { getCurrentUser } from '../services/authApi';
import {
  startAppActivitySession,
  heartbeatAppActivitySession,
  endAppActivitySession,
} from '../services/activityTracker';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  const activityRef = useRef({
    sessionId: null,
    userId: null,
    active: false,
    starting: null,
    heartbeatTimer: null,
  });
  const authSnapshotRef = useRef({
    token: null,
    userId: null,
    isAuthenticated: false,
  });
  const appStateRef = useRef(AppState.currentState);

  const clearHeartbeat = () => {
    if (activityRef.current.heartbeatTimer) {
      clearInterval(activityRef.current.heartbeatTimer);
      activityRef.current.heartbeatTimer = null;
    }
  };

  const waitForStart = async () => {
    if (activityRef.current.starting) {
      try {
        await activityRef.current.starting;
      } catch (_) {
        // Non-critical.
      }
    }
  };

  const stopActivitySession = async (reason = 'inactive', waitForPendingStart = true) => {
    const { sessionId } = activityRef.current;
    clearHeartbeat();

    if (!sessionId) {
      activityRef.current.active = false;
      return;
    }

    try {
      if (waitForPendingStart) {
        await waitForStart();
      }
      const { token } = authSnapshotRef.current;
      if (token) {
        await endAppActivitySession(token, sessionId, reason);
      }
    } catch (error) {
      console.warn('Activity session end failed:', error.message);
    } finally {
      activityRef.current.sessionId = null;
      activityRef.current.userId = null;
      activityRef.current.active = false;
    }
  };

  const startActivitySession = async () => {
    if (!isInitialized) return null;

    const { token, userId, isAuthenticated } = authSnapshotRef.current;
    if (!token || !userId || !isAuthenticated) return null;

    if (activityRef.current.active && activityRef.current.sessionId && activityRef.current.userId === userId) {
      return activityRef.current.sessionId;
    }

    if (activityRef.current.starting) {
      return activityRef.current.starting;
    }

    const sessionId = Crypto.randomUUID();
    const startPromise = (async () => {
      try {
        await stopActivitySession('switch', false);
        const response = await startAppActivitySession(token, sessionId);
        const startedSessionId = response?.data?.sessionId || sessionId;

        if (authSnapshotRef.current.token !== token || authSnapshotRef.current.userId !== userId || appStateRef.current !== 'active') {
          await endAppActivitySession(token, startedSessionId, 'stale-start').catch(() => {});
          return null;
        }

        activityRef.current.sessionId = startedSessionId;
        activityRef.current.userId = userId;
        activityRef.current.active = true;
        clearHeartbeat();
        activityRef.current.heartbeatTimer = setInterval(() => {
          const { token: latestToken } = authSnapshotRef.current;
          const currentSessionId = activityRef.current.sessionId;
          if (latestToken && currentSessionId && appStateRef.current === 'active') {
            heartbeatAppActivitySession(latestToken, currentSessionId).catch(() => {});
          }
        }, 30000);
        return response;
      } catch (error) {
        console.warn('Activity session start failed:', error.message);
        return null;
      } finally {
        activityRef.current.starting = null;
      }
    })();

    activityRef.current.starting = startPromise;
    return startPromise;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userStr = await AsyncStorage.getItem('user');

        if (!token) {
          setIsInitialized(true);
          return;
        }

        try {
          const res = await getCurrentUser(token);

          if (res.success && res.user) {
            await AsyncStorage.setItem('user', JSON.stringify(res.user));
            dispatch(initializeAuth({ token, user: res.user }));
            dispatch(fetchSubscriptions(token));
          } else {
            await AsyncStorage.multiRemove(['authToken', 'user']);
            dispatch(logout());
          }
        } catch (networkErr) {
          console.warn('Token validation failed (network):', networkErr.message);
          if (userStr) {
            const cachedUser = JSON.parse(userStr);
            dispatch(initializeAuth({ token, user: cachedUser }));
            dispatch(fetchSubscriptions(token));
          } else {
            await AsyncStorage.multiRemove(['authToken', 'user']);
            dispatch(logout());
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        await AsyncStorage.multiRemove(['authToken', 'user']);
        dispatch(logout());
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [dispatch]);

  useEffect(() => {
    authSnapshotRef.current = {
      token: auth.token,
      userId: auth.user?._id ? String(auth.user._id) : null,
      isAuthenticated: auth.isAuthenticated,
    };
  }, [auth.token, auth.user?._id, auth.isAuthenticated]);

  useEffect(() => {
    if (!isInitialized) return;

    const shouldTrack = auth.isAuthenticated && auth.token && auth.user?._id;
    if (shouldTrack) {
      startActivitySession();
    } else {
      stopActivitySession('logout');
    }
  }, [isInitialized, auth.isAuthenticated, auth.token, auth.user?._id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      appStateRef.current = nextState;

      if (!isInitialized) return;

      if (nextState === 'active') {
        if (authSnapshotRef.current.isAuthenticated) {
          await startActivitySession();
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        await stopActivitySession(nextState);
      }
    });

    return () => {
      sub.remove();
    };
  }, [isInitialized]);

  const handleLogout = async () => {
    try {
      await stopActivitySession('logout');
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
