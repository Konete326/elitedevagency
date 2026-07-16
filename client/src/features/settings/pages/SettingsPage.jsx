import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getSystemPrinters } from '../../../lib/device';
import { Printer, RefreshCw, Terminal, Save, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { selectedPrinter, setSelectedPrinter } = useSettingsStore();

  const activeTab = searchParams.get('tab') || 'printer';

  const [printers, setPrinters] = useState([]);
  const [scanning, setScanning] = useState(false);

  const [easyPaisaName, setEasyPaisaName] = useState('');
  const [easyPaisaNumber, setEasyPaisaNumber] = useState('');
  const [jazzCashName, setJazzCashName] = useState('');
  const [jazzCashNumber, setJazzCashNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = useCallback(async () => {
    setScanning(true);
    try {
      const printerList = await getSystemPrinters();
      setPrinters(printerList);
      if (printerList.length > 0 && !selectedPrinter) {
        const defaultPrinter = printerList.find((p) => p.isDefault) || printerList[0];
        setSelectedPrinter(defaultPrinter.name);
      }
    } catch {
    } finally {
      setScanning(false);
    }
  }, [selectedPrinter, setSelectedPrinter]);

  useEffect(() => {
    handleScan();
    
    fetch('/api/tenant/settings')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setEasyPaisaName(res.data.easyPaisaName || '');
          setEasyPaisaNumber(res.data.easyPaisaNumber || '');
          setJazzCashName(res.data.jazzCashName || '');
          setJazzCashNumber(res.data.jazzCashNumber || '');
          setBankName(res.data.bankName || '');
          setBankIban(res.data.bankIban || '');
        }
      })
      .catch(() => {});
  }, [handleScan]);

  const handleSavePayments = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          easyPaisaName,
          easyPaisaNumber,
          jazzCashName,
          jazzCashNumber,
          bankName,
          bankIban
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Wallet payment settings updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update settings');
      }
    } catch {
      toast.error('Network error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-6">
        
        <div className="w-full md:w-1/4 flex flex-col gap-2 shrink-0">
          <div className="mb-4">
            <h1 className="text-base font-bold tracking-tight">System Settings</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Configure system modules</p>
          </div>

          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            <button
              onClick={() => handleTabChange('printer')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'printer'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>Printer Setup</span>
            </button>

            {user?.niche === 'RESTAURANT' && (
              <button
                onClick={() => handleTabChange('wallet')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted text-muted-foreground'
              }`}
              >
                <Wallet className="h-4 w-4" />
                <span>Wallet Setup</span>
              </button>
            )}

            <button
              onClick={() => navigate('/settings/logs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-muted text-muted-foreground cursor-pointer whitespace-nowrap"
            >
              <Terminal className="h-4 w-4" />
              <span>System Logs</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-sm min-h-[400px]">
          {activeTab === 'printer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Hardware & Printers</h2>
                <p className="text-xs text-muted-foreground">Configure connection profiles for thermal receipt printing</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-lg">
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
                    <span>Scan Devices</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted-foreground">Select Target Device</label>
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
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && user?.niche === 'RESTAURANT' && (
            <form onSubmit={handleSavePayments} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight">Wallet & Table Ordering Payments</h2>
                  <p className="text-xs text-muted-foreground">Configure manual checkout methods details</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Setup</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <h3 className="text-xs font-bold tracking-tight text-primary">EasyPaisa Account</h3>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground">Account Title Name</label>
                      <input
                        type="text"
                        value={easyPaisaName}
                        onChange={(e) => setEasyPaisaName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground">Account Mobile Number</label>
                      <input
                        type="text"
                        value={easyPaisaNumber}
                        onChange={(e) => setEasyPaisaNumber(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <h3 className="text-xs font-bold tracking-tight text-primary">JazzCash Account</h3>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground">Account Title Name</label>
                      <input
                        type="text"
                        value={jazzCashName}
                        onChange={(e) => setJazzCashName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground">Account Mobile Number</label>
                      <input
                        type="text"
                        value={jazzCashNumber}
                        onChange={(e) => setJazzCashNumber(e.target.value)}
                        placeholder="e.g. 03007654321"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <h3 className="text-xs font-bold tracking-tight text-primary">Direct Bank Account Transfer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Habib Bank Limited"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground">Bank Account IBAN (24 digits)</label>
                      <input
                        type="text"
                        value={bankIban}
                        onChange={(e) => setBankIban(e.target.value)}
                        placeholder="e.g. PK00 HABB 0000 1234 5678 9012"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

      </main>
    </div>
  );
};

export default SettingsPage;
