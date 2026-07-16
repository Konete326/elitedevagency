import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLicenseStore } from '../store/useLicenseStore';
import { getDeviceFingerprint } from '../lib/device';

export const useHeartbeat = () => {
  const { token, isAuthenticated } = useAuthStore();
  const setLocked = useLicenseStore((state) => state.setLocked);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let intervalId;

    const performCheck = async () => {
      try {
        const fingerprint = await getDeviceFingerprint();
        const apiURL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
        
        const response = await fetch(
          `${apiURL}/heartbeat?deviceFingerprint=${encodeURIComponent(fingerprint)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.status === 401 || response.status === 403) {
          const result = await response.json().catch(() => ({}));
          setLocked(true, result.error || 'Session unauthorized or account suspended');
          return;
        }

        const result = await response.json();
        if (response.ok && result.success) {
          if (result.data.status === 'locked') {
            setLocked(true, result.data.reason);
          } else {
            setLocked(false, '');
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              const currentFeatures = currentUser.features || [];
              const nextFeatures = result.data.features || [];
              const featuresChanged = currentFeatures.length !== nextFeatures.length ||
                !currentFeatures.every((f) => nextFeatures.includes(f));
              
              const suspensionChanged = currentUser.isSuspended !== result.data.isSuspended ||
                currentUser.suspensionTitle !== result.data.suspensionTitle ||
                currentUser.suspensionDescription !== result.data.suspensionDescription;

              const currentTheme = currentUser.customTheme || {};
              const nextTheme = result.data.customTheme || {};
              const themeChanged = currentTheme.lightPrimary !== nextTheme.lightPrimary ||
                currentTheme.darkPrimary !== nextTheme.darkPrimary;
              
              if (currentUser.blockMobileAccess !== result.data.blockMobileAccess || featuresChanged || suspensionChanged || themeChanged) {
                useAuthStore.setState({
                  user: {
                    ...currentUser,
                    blockMobileAccess: result.data.blockMobileAccess,
                    features: nextFeatures,
                    isSuspended: result.data.isSuspended,
                    suspensionTitle: result.data.suspensionTitle,
                    suspensionDescription: result.data.suspensionDescription,
                    customTheme: result.data.customTheme || null
                  }
                });
              }
            }
          }
        }
      } catch {
        // Network error / offline - do not update lock state
      }
    };

    performCheck();
    intervalId = setInterval(performCheck, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [token, isAuthenticated, setLocked]);
};
