import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Coffee, Users, Layers, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloorMap = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tables, setTables] = useState([]);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tableNo, setTableNo] = useState('');
  const [capacity, setCapacity] = useState('4');

  const [activeTable, setActiveTable] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [runningOrder, setRunningOrder] = useState(null);

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
    setActiveTable(table);
    if (table.status === 'AVAILABLE') {
      setIsOrderModalOpen(true);
    } else if (table.status === 'OCCUPIED' && table.currentOrderId) {
      try {
        const db = await getDatabase();
        const order = await db.orders.findOne(table.currentOrderId).exec();
        if (order) {
          setRunningOrder(order);
          setIsBillModalOpen(true);
        } else {
          toast.error('Running order details not found');
        }
      } catch {
        toast.error('Error fetching running order');
      }
    }
  };

  const handleStartOrder = async () => {
    if (!activeTable) return;
    try {
      const db = await getDatabase();
      const orderId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      const newOrder = {
        _id: orderId,
        tenantId: user?.tenantId || 'default',
        items: [],
        totalAmount: 0,
        paymentMode: 'CASH',
        returnStatus: 'NONE',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      await db.orders.insert(newOrder);

      const tableDoc = await db.tables.findOne(activeTable._id).exec();
      if (tableDoc) {
        await tableDoc.patch({
          status: 'OCCUPIED',
          currentOrderId: orderId,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
      }

      setIsOrderModalOpen(false);
      navigate('/', { state: { activeTableNo: activeTable.tableNo, activeOrderId: orderId } });
    } catch {
      toast.error('Failed to initialize order');
    }
  };

  const canManage = user?.role === 'OWNER' || user?.role === 'MANAGER';

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors mr-2 text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-lg tracking-tight">Floor Map Management</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 relative pb-24">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border rounded-2xl text-muted-foreground space-y-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5">
              <Layers className="h-5 w-5 text-accent-niche" /> Onboard Table
            </h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Table Code / Number</label>
                <input
                  type="text"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none"
                  placeholder="e.g. T1, T2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Sitting Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none"
                  placeholder="e.g. 4"
                />
              </div>
              <button type="submit" className="w-full rounded-lg bg-foreground text-background py-2 text-xs font-bold">
                Save Table
              </button>
            </form>
          </div>
        </div>
      )}

      {isOrderModalOpen && activeTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-xl border border-border bg-card p-6 shadow-xl text-center relative">
            <h3 className="text-lg font-black tracking-tight mb-2">Table {activeTable.tableNo} Available</h3>
            <p className="text-xs text-muted-foreground mb-6 font-semibold">Start a running sales order on this table?</p>
            <div className="flex gap-2">
              <button onClick={() => setIsOrderModalOpen(false)} className="flex-1 rounded-lg border border-border py-2 text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleStartOrder} className="flex-1 rounded-lg bg-emerald-600 text-white py-2 text-xs font-bold">
                Start Order
              </button>
            </div>
          </div>
        </div>
      )}

      {isBillModalOpen && activeTable && runningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl relative">
            <button onClick={() => setIsBillModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-1 flex items-center gap-1.5">
              <Receipt className="h-5 w-5 text-red-500" /> Running Bill
            </h3>
            <p className="text-xs text-muted-foreground mb-4 font-mono font-bold">Table {activeTable.tableNo} - Order #{runningOrder._id.slice(0, 8)}</p>
            <div className="max-h-48 overflow-y-auto divide-y divide-border pr-1 mb-4">
              {runningOrder.items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No items added to this order yet.</p>
              ) : (
                runningOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-xs font-semibold">
                    <div>
                      <p>{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">Qty {item.quantity} x ${item.price}</p>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border pt-4 flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-muted-foreground uppercase">Subtotal Due</span>
              <span className="text-lg font-black text-red-500">${runningOrder.totalAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                setIsBillModalOpen(false);
                navigate('/', { state: { activeTableNo: activeTable.tableNo, activeOrderId: runningOrder._id } });
              }}
              className="w-full rounded-lg bg-foreground text-background py-2.5 text-xs font-bold"
            >
              Resume Table Order in POS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorMap;
