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
import { TenantOnboardForm } from './features/superadmin/components/TenantOnboardForm';
import { HardwareApproval } from './features/superadmin/components/HardwareApproval';
import { ProductManager } from './features/inventory/pages/ProductManager';
import { DealsManager } from './features/inventory/pages/DealsManager';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { ReportsPage } from './features/analytics/pages/ReportsPage';
import { ReturnsPage } from './features/billing/pages/ReturnsPage';
import { EmployeeManagement } from './features/management/pages/EmployeeManagement';
import { OrderHistory } from './features/billing/pages/OrderHistory';
import { FloorMap } from './features/restaurant/pages/FloorMap';
import { PlanManager } from './features/gym/pages/PlanManager';
import { MemberManager } from './features/gym/pages/MemberManager';
import { PaymentGrid } from './features/gym/pages/PaymentGrid';
import { TrainerPayroll } from './features/gym/pages/TrainerPayroll';
import { MeasurementTracker } from './features/gym/pages/MeasurementTracker';
import { CashDrawer } from './features/billing/pages/CashDrawer';
import { Khata } from './features/customers/pages/Khata';

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
          startReplication(db, 'categories');
          startReplication(db, 'tables');
          startReplication(db, 'deals');
          startReplication(db, 'plans');
          startReplication(db, 'members');
          startReplication(db, 'payments');
          startReplication(db, 'trainers');
          startReplication(db, 'trainer_ledgers');
          startReplication(db, 'measurements');
          startReplication(db, 'customers');
          startReplication(db, 'cash_shifts');
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
          <Toaster richColors position="top-right" closeButton />
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
              path="/deals" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <DealsManager />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/plans" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <PlanManager />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/members" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <MemberManager />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/payments" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <PaymentGrid />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/trainers" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <TrainerPayroll />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/measurements" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <MeasurementTracker />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/galla" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : (
                  <CashDrawer />
                )
              } 
            />
            <Route 
              path="/khata" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : (
                  <Khata />
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
            <Route 
              path="/returns" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <ReturnsPage />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/employees" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : user?.role === 'OWNER' || user?.role === 'MANAGER' ? (
                  <EmployeeManagement />
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/orders" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : (
                  <OrderHistory />
                )
              } 
            />
            <Route 
              path="/floor-map" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <Dashboard />
                  </SuperAdminLayout>
                ) : (
                  <FloorMap />
                )
              } 
            />
            <Route 
              path="/superadmin" 
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
              path="/superadmin/tenants/new" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <TenantOnboardForm onSuccess={() => {}} />
                  </SuperAdminLayout>
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/superadmin/hardware" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <HardwareApproval />
                  </SuperAdminLayout>
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
