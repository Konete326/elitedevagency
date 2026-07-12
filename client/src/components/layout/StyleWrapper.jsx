import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export const StyleWrapper = ({ children }) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'SUPERADMIN')) {
      document.documentElement.style.setProperty('--accent', '#0052FF');
      document.documentElement.style.setProperty('--accent-secondary', '#4D7CFF');
    } else if (user && user.customTheme) {
      const lightAccent = user.customTheme.lightPrimary || user.customTheme.lightAccent;
      const darkAccent = user.customTheme.darkPrimary || user.customTheme.darkAccent;

      if (lightAccent) {
        document.documentElement.style.setProperty('--accent', lightAccent);
      } else {
        document.documentElement.style.setProperty('--accent', '#0052FF');
      }

      if (darkAccent) {
        document.documentElement.style.setProperty('--accent-secondary', darkAccent);
      } else {
        document.documentElement.style.setProperty('--accent-secondary', '#4D7CFF');
      }
    } else {
      document.documentElement.style.setProperty('--accent', '#0052FF');
      document.documentElement.style.setProperty('--accent-secondary', '#4D7CFF');
    }
  }, [user]);

  return children;
};

export default StyleWrapper;
