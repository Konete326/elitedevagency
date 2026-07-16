import { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { ArrowLeft, Printer, RefreshCw, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TableQrManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [startNo, setStartNo] = useState(1);
  const [count, setCount] = useState(4);
  const [generated, setGenerated] = useState([]);

  const handleGenerate = () => {
    const list = [];
    const baseNum = parseInt(startNo, 10) || 1;
    const total = parseInt(count, 10) || 1;
    for (let i = 0; i < total; i++) {
      const tableNo = String(baseNum + i);
      const url = `http://localhost:5173/menu/${user?.tenantId || 'default'}/${tableNo}`;
      list.push({ tableNo, url });
    }
    setGenerated(list);
  };

  const handlePrint = () => {
    window.print();
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

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="no-print flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/floor-map')}
            className="flex items-center justify-center p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">Table QR Code Generator</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Generate and print A4 layouts with QR codes for customer self-ordering</p>
          </div>
        </div>

        <div className="no-print rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground">Starting Table Number</label>
              <input
                type="number"
                min="1"
                value={startNo}
                onChange={(e) => setStartNo(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground">Number of Tables</label>
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-bold px-4 py-2 text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Generate Codes</span>
            </button>

            {generated.length > 0 && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card font-bold px-4 py-2 text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print QR Cards</span>
              </button>
            )}
          </div>
        </div>

        {generated.length > 0 ? (
          <div className="print-area grid grid-cols-1 sm:grid-cols-2 gap-6">
            {generated.map((item) => (
              <div
                key={item.tableNo}
                className="print-card rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-sm space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight text-primary">{user?.businessName || 'Elite Restaurant'}</h3>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Self Service Ordering</p>
                </div>

                <div className="p-3 bg-white border border-border rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.url)}`}
                    alt={`Table ${item.tableNo} QR Code`}
                    className="h-44 w-44 object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-4 py-1 text-sm font-black">
                    Table {item.tableNo}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium max-w-[200px]">
                    Scan QR with your phone camera to view menu, place orders, and pay directly.
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-print flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-2xl text-muted-foreground space-y-3 bg-card/50">
            <Grid className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-xs font-semibold">No QR cards generated. Configure options above to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TableQrManager;
