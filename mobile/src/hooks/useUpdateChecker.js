import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getCurrentUpdate, dismissUpdate } from '../services/appUpdateApi';

/**
 * Custom hook to check for app updates
 * Checks every 1 minute when app is active
 * Shows update dialog when available
 */
export const useUpdateChecker = (token) => {
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(0);

  // Check for updates
  const checkForUpdates = async () => {
    try {
      // Prevent too frequent checks (min 30 seconds between checks)
      const now = Date.now();
      if (now - lastCheckRef.current < 30000) {
        return;
      }
      lastCheckRef.current = now;

      const response = await getCurrentUpdate(token);

      if (response.success && response.updateAvailable && response.data) {
        setUpdateAvailable(response.data);
        setShowDialog(true);
      } else {
        setUpdateAvailable(null);
      }
    } catch (error) {
      // Silent catch
    }
  };

  // Handle dismiss (Later button)
  const handleDismiss = async (installed = false) => {
    if (!updateAvailable || !token) {
      setShowDialog(false);
      return;
    }

    setIsDismissing(true);
    try {
      await dismissUpdate(token, updateAvailable._id, installed);
      setShowDialog(false);
      setUpdateAvailable(null);
    } catch (error) {
      // Still close dialog even if API fails
      setShowDialog(false);
    } finally {
      setIsDismissing(false);
    }
  };

  // Setup interval and app state listener
  useEffect(() => {
    // Skip if no token
    if (!token) return;

    // Initial check after 5 seconds
    const initialTimer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // Check every 60 seconds (1 minute)
    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, 60000);

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, check for updates
        checkForUpdates();
      }
    });

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription?.remove();
    };
  }, [token]);

  return {
    updateAvailable,
    showDialog,
    isDismissing,
    handleDismiss,
    checkForUpdates, // Export for manual checks
  };
};
