import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentUpdate } from '../services/appUpdateApi';
import { AppState } from 'react-native';

/**
 * Hook to check for app updates
 * Automatically checks on app mount and when app comes to foreground
 */
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  const checkForUpdate = async (silent = false) => {
    // Only check if user is logged in
    if (!token || !user) {
      return;
    }

    try {
      if (!silent) setChecking(true);
      
      const result = await getCurrentUpdate(token);
      
      if (result.success && result.updateAvailable && result.data) {
        setUpdateAvailable(result.data);
      } else {
        setUpdateAvailable(null);
      }
    } catch (error) {
      console.error('useAppUpdate: Error checking for updates:', error);
      setUpdateAvailable(null);
    } finally {
      if (!silent) setChecking(false);
    }
  };

  useEffect(() => {
    // Check on mount
    checkForUpdate(true);

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForUpdate(true);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [token, user]);

  return {
    updateAvailable,
    checking,
    checkForUpdate,
    dismissUpdate: () => setUpdateAvailable(null),
  };
}
