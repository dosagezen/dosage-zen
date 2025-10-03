import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotificationPermission } from '@/lib/notifications/service-worker-utils';

export const useNotificationPermissionDialog = () => {
  const { user, profile } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Only show dialog if:
    // 1. User is logged in
    // 2. Permission hasn't been asked before
    // 3. Permission is still 'default' (not granted or denied)
    const hasAsked = localStorage.getItem('notification-permission-asked');
    const permission = getNotificationPermission();

    if (user && profile && !hasAsked && permission === 'default') {
      // Wait 3 seconds after login to show dialog
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  const handleClose = () => {
    setShowDialog(false);
    localStorage.setItem('notification-permission-asked', 'true');
  };

  return {
    showDialog,
    setShowDialog,
    handleClose,
    userId: user?.id,
    profileId: profile?.id
  };
};
