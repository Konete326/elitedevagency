import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Component } from 'react';
import { LoginPage } from './pages/LoginPage';
import { POSPage } from './features/billing/pages/POSPage';
import { useAuthStore } from './store/useAuthStore';
import { getDatabase } from './db/database';
import { startReplication, stopAllReplications } from './lib/sync';
import { startImageSync, stopImageSync } from './lib/imageSync';
import { useLicenseStore } from './store/useLicenseStore';
import { useHeartbeat } from './hooks/useHeartbeat';
import { LockScreen } from './components/LockScreen';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { Dashboard } from './features/superadmin/pages/Dashboard';
import { ProductManager } from './features/inventory/pages/ProductManager';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { ReportsPage } from './features/analytics/pages/ReportsPage';

const queryClient = new QueryClient();

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-red-50 text-red-900">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <p className="mt-2">The application encountered an unexpected error.</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { isAuthenticated, user, token } = useAuthStore();
  const { isLocked, lockReason } = useLicenseStore();

  useHeartbeat();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-gym', 'theme-restaurant', 'theme-garments');

    const existingStyle = document.getElementById('custom-theme-vars');
    if (existingStyle) existingStyle.remove();

    if (!isAuthenticated || !user) return;

    const { customTheme, niche } = user;
    const hasCustom = customTheme?.lightPrimary || customTheme?.darkPrimary;

    if (hasCustom) {
      const light = customTheme.lightPrimary || customTheme.darkPrimary;
      const dark = customTheme.darkPrimary || customTheme.lightPrimary;
      const styleEl = document.createElement('style');
      styleEl.id = 'custom-theme-vars';
      styleEl.textContent = [
        `:root { --accent-niche: ${light}; --ring: ${light}; }`,
        `.dark { --accent-niche: ${dark}; --ring: ${dark}; }`
      ].join('\n');
      document.head.appendChild(styleEl);
    } else if (niche) {
      root.classList.add(`theme-${niche.toLowerCase()}`);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let active = true;
    if (isAuthenticated && token && !isLocked && user?.role !== 'SUPER_ADMIN') {
      getDatabase().then((db) => {
        if (active) {
          startReplication(db, 'products');
          startReplication(db, 'orders');
          startImageSync();
        }
      });
    } else {
      stopAllReplications();
      stopImageSync();
    }
    return () => {
      active = false;
      stopAllReplications();
      stopImageSync();
    };
  }, [isAuthenticated, token, isLocked, user]);

  if (isLocked) {
    return (
      <ErrorBoundary>
        <LockScreen reason={lockReason} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route 
              path="/" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/inventory" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <ProductManager />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/settings" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <SettingsPage />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/reports" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <ReportsPage />
                ) : (
                  <POSPage />
                )
              } 
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
