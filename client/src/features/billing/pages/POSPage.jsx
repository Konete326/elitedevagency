import { useEffect } from 'react';
import { ProductGrid } from '../components/ProductGrid';
import { Cart } from '../components/Cart';
import { useAuthStore } from '../../../store/useAuthStore';
import { LogOut, LayoutDashboard, Package, Settings, TrendingUp, Wifi, WifiOff, Download, RotateCcw, Users, History, LayoutGrid, Tag, Award, UserCheck, CircleDollarSign, Activity, Coins, Wallet } from 'lucide-react';
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
  const features = user?.features || [];

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
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-hidden p-4 md:p-6 w-full mx-auto">
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
