import { useEffect } from 'react';
import { ProductGrid } from '../components/ProductGrid';
import { Cart } from '../components/Cart';
import { useAuthStore } from '../../../store/useAuthStore';
import { LogOut, LayoutDashboard, Package, Settings, TrendingUp, Wifi, WifiOff, Download, RotateCcw, Users, History, LayoutGrid, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { usePwaInstall } from '../../../hooks/usePwaInstall';
import { toast } from 'sonner';
import { getDatabase } from '../../../db/database';
import { useCartStore } from '../../../store/useCartStore';

export const POSPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const { isInstallable, promptInstall } = usePwaInstall();

  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = async (e) => {
      const now = Date.now();
      if (now - lastKeyTime > 50) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key.length === 1) {
        buffer += e.key;
      } else if (e.key === 'Enter') {
        if (buffer.length >= 8) {
          e.preventDefault();
          const scannedCode = buffer;
          buffer = '';
          
          try {
            const db = await getDatabase();
            const allProducts = await db.products.find({ selector: { isDeleted: false } }).exec();
            
            let matchedProduct = null;
            let matchedVariant = null;
            
            for (const prod of allProducts) {
              if (prod.variants && prod.variants.length > 0) {
                const foundVar = prod.variants.find(v => v.barcode === scannedCode);
                if (foundVar) {
                  matchedProduct = prod;
                  matchedVariant = foundVar;
                  break;
                }
              }
            }
            
            if (matchedProduct && matchedVariant) {
              const addToCart = useCartStore.getState().addToCart;
              addToCart({
                id: matchedProduct._id,
                name: matchedProduct.name,
                price: matchedProduct.price,
                image: matchedProduct.image,
                promotionalDiscount: matchedProduct.promotionalDiscount,
                selectedVariant: matchedVariant
              });
              toast.success(`Scanned: ${matchedProduct.name} (${matchedVariant.size}/${matchedVariant.color})`);
            } else {
              toast.error('Scanned barcode not found');
            }
          } catch {
            toast.error('Failed to query scanned barcode');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-accent-niche" />
          <span className="font-extrabold text-lg tracking-tight">Unified POS Engine</span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-colors ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
          }`}>
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shrink-0 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          )}

          {user?.niche === 'restaurant' && (
            <button
              onClick={() => navigate('/floor-map')}
              className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          )}

          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role}</p>
            <p className="text-sm font-black">{user?.name}</p>
          </div>

          {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                title="Product Catalog"
              >
                <Package className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/deals')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                title="Deals Catalog"
              >
                <Tag className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/returns')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                <History className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/employees')}
                className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                <Users className="h-5 w-5" />
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
