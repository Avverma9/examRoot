import React from 'react';
import { useSelector } from 'react-redux';
import { useUpdateChecker } from '../hooks/useUpdateChecker';
import UpdateDialog from './UpdateDialog';

/**
 * Wrapper component that checks for updates in background
 * Shows update dialog when available
 */
const AppUpdateWrapper = ({ children }) => {
  const token = useSelector((state) => state.auth?.token);
  
  const {
    updateAvailable,
    showDialog,
    isDismissing,
    handleDismiss,
  } = useUpdateChecker(token);

  return (
    <>
      {children}
      
      <UpdateDialog
        visible={showDialog}
        update={updateAvailable}
        onDismiss={handleDismiss}
        isDismissing={isDismissing}
      />
    </>
  );
};

export default AppUpdateWrapper;
