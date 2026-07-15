import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCartStore } from '../../../store/useCartStore';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Coffee, Users, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloorMap = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tables, setTables] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tableNo, setTableNo] = useState('');
  const [capacity, setCapacity] = useState('4');

  const setTableContext = useCartStore((state) => state.setTableContext);
  const loadOrderIntoCart = useCartStore((state) => state.loadOrderIntoCart);

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.tables
        .find({
          selector: { isDeleted: false },
          sort: [{ tableNo: 'asc' }]
        })
        .$.subscribe((docs) => {
          setTables(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableNo) {
      toast.error('Table number is required');
      return;
    }

    try {
      const db = await getDatabase();
      const existing = await db.tables.findOne({
        selector: { tableNo, isDeleted: false }
      }).exec();

      if (existing) {
        toast.error('Table number already exists');
        return;
      }

      const tableId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await db.tables.insert({
        _id: tableId,
        tenantId: user?.tenantId || 'default',
        tableNo,
        capacity: parseInt(capacity, 10) || 4,
        status: 'AVAILABLE',
        currentOrderId: '',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Table added successfully');
      setIsAddOpen(false);
      setTableNo('');
      setCapacity('4');
    } catch {
      toast.error('Failed to add table');
    }
  };

  const handleTableClick = async (table) => {
    if (table.status === 'AVAILABLE') {
      setTableContext(table._id, table.tableNo);
      navigate('/');
    } else if (table.status === 'OCCUPIED' && table.currentOrderId) {
      try {
        const db = await getDatabase();
        const orderDoc = await db.orders.findOne(table.currentOrderId).exec();
        if (orderDoc) {
          const cartItems = await Promise.all((orderDoc.items || []).map(async (item) => {
            if (item.isDeal) {
              const dealDoc = await db.deals.findOne(item.productId).exec();
              return {
                id: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                isDeal: true,
                items: dealDoc ? (dealDoc.items || []) : [],
                cartItemId: `deal-${item.productId}`
              };
            }
            return {
              id: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              variantSku: item.variantSku || '',
              spiceLevel: item.spiceLevel || '',
              selectedAddons: item.selectedAddons || [],
              cartItemId: `${item.productId}-${item.variantSku || ''}-${item.spiceLevel || ''}-${(item.selectedAddons || []).map((a) => a.name).sort().join(',')}`
            };
          }));
          loadOrderIntoCart(cartItems, table._id, table.tableNo, orderDoc._id);
          navigate('/');
        } else {
          toast.error('Running order details not found');
        }
      } catch {
        toast.error('Error fetching running order');
      }
    }
  };

  const canManage = user?.role === 'OWNER' || user?.role === 'MANAGER';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 relative pb-24 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Floor Map Management</h1>
          <p className="text-xs text-muted-foreground">Setup tables, track reservation occupancy, and map restaurant seating zones</p>
        </div>
        {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border dark:border-zinc-700 rounded-2xl text-muted-foreground space-y-3 bg-white dark:bg-zinc-800">
              <Coffee className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-semibold">No tables mapped. Click floating button to onboard.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {tables.map((table) => (
                <button
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-6 transition-all duration-300 transform active:scale-95 shadow-sm ${
                    table.status === 'OCCUPIED'
                      ? 'border-red-500 bg-red-500/5 hover:bg-red-500/10 shadow-red-500/10'
                      : 'border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-emerald-500/10'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${table.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <Coffee className="h-7 w-7" />
                  </div>
                  <span className="text-lg font-black tracking-tight">Table {table.tableNo}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 font-mono">
                    <Users className="h-3 w-3" /> Pax {table.capacity}
                  </span>
                </button>
              ))}
            </div>
          )}

          {canManage && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="fixed bottom-8 right-8 flex items-center justify-center h-14 w-14 rounded-full bg-foreground text-background shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="h-6 w-6" />
            </button>
          )}
        </main>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5">
              <Layers className="h-5 w-5 text-accent" /> Onboard Table
            </h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Table Code / Number</label>
                <input
                  type="text"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="e.g. T1, T2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Sitting Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="e.g. 4"
                />
              </div>
              <button type="submit" className="w-full rounded-lg bg-foreground text-background py-3 text-xs font-bold shadow-sm">
                Save Table
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorMap;
