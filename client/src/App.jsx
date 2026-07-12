import { useEffect, useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
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
import { DiagnosticsPanel } from './features/superadmin/pages/DiagnosticsPanel';
import { PricingTiersManager } from './features/superadmin/pages/PricingTiersManager';
import { StyleWrapper } from './components/layout/StyleWrapper';
import { ModalManager } from './components/ui/ModalManager';
import { Agentation } from 'agentation';
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

function MobileBlockerGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const [isTooNarrow, setIsTooNarrow] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsTooNarrow(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isAuthenticated && user?.role !== 'SUPER_ADMIN' && user?.blockMobileAccess && isTooNarrow) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white p-6 text-center select-none pointer-events-auto">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-red-500">Access Restricted</h2>
          <p className="text-sm font-semibold text-slate-300">
            Mobile and Tablet layouts are disabled for this account. Please log in using a desktop or widescreen terminal.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

function FeatureGuard({ feature, children }) {
  const { user } = useAuthStore();
  const features = user?.features || [];

  if (user?.role === 'SUPER_ADMIN') {
    return children;
  }

  if (!features.includes(feature)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white p-6 text-center select-none">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-red-500">Access Denied</h2>
          <p className="text-sm font-semibold text-slate-350">
            This feature is not enabled for your account. Please contact your administrator.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white text-slate-950 font-bold px-4 py-2 text-sm hover:bg-slate-100 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function SuspensionGuard({ children }) {
  const { user } = useAuthStore();

  if (user?.role === 'SUPER_ADMIN') {
    return children;
  }

  if (user?.isSuspended) {
    const title = user.suspensionTitle || 'Account Suspended';
    const description = user.suspensionDescription || 'Your subscription workspace has been suspended. Please contact the administrator to resolve your account status and billing history.';

    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center select-none font-semibold">
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-black tracking-tight text-red-500">{title}</h2>
          <p className="text-sm font-semibold text-slate-350">{description}</p>
        </div>
      </div>
    );
  }

  return children;
}

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
          startReplication(db, 'pricing_tiers');
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
        <MobileBlockerGuard>
          <StyleWrapper>
            <BrowserRouter>
            <Toaster richColors position="top-right" closeButton />
            <ModalManager />
          <SuspensionGuard>
            <Routes>
            <Route 
              path="/" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <Navigate to="/superadmin" replace />
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
                  <FeatureGuard feature="Instructor Payroll">
                    <TrainerPayroll />
                  </FeatureGuard>
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
                  <FeatureGuard feature="BMI Tracker">
                    <MeasurementTracker />
                  </FeatureGuard>
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
                  <FeatureGuard feature="Table Management">
                    <FloorMap />
                  </FeatureGuard>
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
            <Route 
              path="/superadmin/pricing-tiers" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <PricingTiersManager />
                  </SuperAdminLayout>
                ) : (
                  <POSPage />
                )
              } 
            />
            <Route 
              path="/superadmin/diagnostics" 
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : user?.role === 'SUPER_ADMIN' ? (
                  <SuperAdminLayout>
                    <DiagnosticsPanel />
                  </SuperAdminLayout>
                ) : (
                  <POSPage />
                )
              } 
            />
            </Routes>
          </SuspensionGuard>
          </BrowserRouter>
        </StyleWrapper>
        {import.meta.env.DEV && <Agentation />}
        </MobileBlockerGuard>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
