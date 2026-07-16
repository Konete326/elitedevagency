import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { ArrowLeft, Printer, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const TableQrManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  const [tableNo, setTableNo] = useState('');
  const [capacity, setCapacity] = useState('4');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.tables
        .find({
          selector: { isDeleted: false }
        })
        .$.subscribe((docs) => {
          const sorted = [...docs].sort((a, b) => {
            const aNum = parseInt(a.tableNo, 10);
            const bNum = parseInt(b.tableNo, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return a.tableNo.localeCompare(b.tableNo);
          });
          setTables(sorted);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNo('');
    setCapacity('4');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setTableNo(table.tableNo);
    setCapacity(String(table.capacity));
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
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

      if (existing && (!editingTable || existing._id !== editingTable._id)) {
        toast.error('Table number already exists');
        return;
      }

      if (editingTable) {
        const doc = await db.tables.findOne(editingTable._id).exec();
        if (doc) {
          await doc.atomicPatch({
            tableNo,
            capacity: parseInt(capacity, 10) || 4,
            updatedAt: new Date().toISOString()
          });
          toast.success('Table updated successfully');
        }
      } else {
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
        toast.success('Table and QR generated successfully');
      }

      setIsModalOpen(false);
      setTableNo('');
      setCapacity('4');
    } catch {
      toast.error('Failed to save table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table and its QR code?')) return;
    try {
      const db = await getDatabase();
      const doc = await db.tables.findOne(id).exec();
      if (doc) {
        await doc.atomicPatch({
          isDeleted: true,
          updatedAt: new Date().toISOString()
        });
        toast.success('Table removed successfully');
      }
    } catch {
      toast.error('Failed to delete table');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getQrUrl = (no) => {
    const targetUrl = `${window.location.protocol}//${window.location.host}/menu/${user?.tenantId || 'default'}/${no}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(targetUrl)}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground transition-colors duration-300">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 0.75rem !important;
            padding: 2rem !important;
            text-align: center !important;
          }
        }
      `}</style>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="no-print flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/floor-map')}
              className="flex items-center justify-center p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">Table QR Manager</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Configure restaurant tables and print order-ready QR tags</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-bold px-3.5 py-2 text-xs transition-opacity cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Table</span>
            </button>

            {tables.length > 0 && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card font-bold px-3.5 py-2 text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print All</span>
              </button>
            )}
          </div>
        </div>

        <div className="print-area grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {tables.map((table) => (
            <div
              key={table._id}
              className="print-card rounded-xl border border-border bg-card p-5 shadow-xs text-center flex flex-col justify-between items-center relative overflow-hidden"
            >
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="flex items-center justify-between w-full border-b border-border/60 pb-2 no-print">
                  <span className="text-[10px] text-muted-foreground font-black">SEATS: {table.capacity}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1 rounded border border-border bg-background text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(table._id)}
                      className="p-1 rounded border border-red-500/10 bg-background text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs">
                  <img
                    src={getQrUrl(table.tableNo)}
                    alt={`Table ${table.tableNo} QR`}
                    className="h-36 w-36 object-contain"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-black text-foreground">TABLE {table.tableNo}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Scan to Browse Menu & Order</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="no-print py-16 text-center border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted-foreground">No tables configured. Tap "Add Table" to start generating QR codes.</p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-black text-foreground">
                {editingTable ? 'Edit Table Settings' : 'Add New Table'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Table Number *</label>
                <input
                  type="text"
                  required
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-95 font-bold rounded-lg py-2.5 text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Configuration</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableQrManager;
