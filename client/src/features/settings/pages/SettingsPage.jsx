import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getSystemPrinters } from '../../../lib/device';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedPrinter, setSelectedPrinter } = useSettingsStore();

  const [printers, setPrinters] = useState([]);
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(async () => {
    setScanning(true);
    try {
      const printerList = await getSystemPrinters();
      setPrinters(printerList);
      if (printerList.length > 0 && !selectedPrinter) {
        const defaultPrinter = printerList.find((p) => p.isDefault) || printerList[0];
        setSelectedPrinter(defaultPrinter.name);
      }
    } finally {
      setScanning(false);
    }
  }, [selectedPrinter, setSelectedPrinter]);

  useEffect(() => {
    handleScan();
  }, [handleScan]);

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
          <span className="font-extrabold text-lg tracking-tight">System Settings</span>
        </div>

        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role}</p>
          <p className="text-sm font-black">{user?.name}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Hardware & Printers</h2>
            <p className="text-sm text-muted-foreground">Configure connection profiles for thermal receipt printing</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent-niche/10 border border-accent-niche/20 text-accent-niche rounded-lg">
                  <Printer className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Thermal Receipt Printer</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedPrinter ? `Connected: ${selectedPrinter}` : 'No printer selected'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
                <span>Scan</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Select Target Device</label>
              <select
                value={selectedPrinter || ''}
                onChange={(e) => setSelectedPrinter(e.target.value || null)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No printer selected</option>
                {printers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} {p.isDefault ? '(System Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground font-medium">
                Detected hardware interfaces are refreshed using system profiles
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default SettingsPage;
