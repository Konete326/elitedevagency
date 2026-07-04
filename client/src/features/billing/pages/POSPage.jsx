import { ProductGrid } from '../components/ProductGrid';
import { Cart } from '../components/Cart';
import { useAuthStore } from '../../../store/useAuthStore';
import { LogOut, LayoutDashboard, Package, Settings, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const POSPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-accent-niche" />
          <span className="font-extrabold text-lg tracking-tight">Unified POS Engine</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role}</p>
            <p className="text-sm font-black">{user?.name}</p>
          </div>

          {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                <Package className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                <TrendingUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center justify-center p-2 rounded-lg border border-border text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 md:p-8 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
          <div className="lg:col-span-2 h-full flex flex-col min-h-0">
            <ProductGrid />
          </div>
          <div className="h-full flex flex-col min-h-0">
            <Cart />
          </div>
        </div>
      </main>
    </div>
  );
};
export default POSPage;
