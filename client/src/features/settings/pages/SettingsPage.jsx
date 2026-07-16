import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getSystemPrinters } from '../../../lib/device';
import { Printer, RefreshCw, Save, Edit2, Trash2, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { selectedPrinter, setSelectedPrinter } = useSettingsStore();

  const activeTab = searchParams.get('tab') || 'printer';

  const [printers, setPrinters] = useState([]);
  const [scanning, setScanning] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [methodType, setMethodType] = useState('EASYPAISA');
  const [displayName, setDisplayName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [logoPreset, setLogoPreset] = useState('easypaisa-logo');

  const [touchedFields, setTouchedFields] = useState({});

  const handleScan = useCallback(async () => {
    setScanning(true);
    const toastId = toast.loading('Scanning for local system devices...');
    try {
      const printerList = await getSystemPrinters();
      setPrinters(printerList);
      if (printerList.length === 0) {
        toast.error('No thermal printers found on this system.', { id: toastId });
      } else {
        toast.success(`Found ${printerList.length} printers successfully.`, { id: toastId });
        const defaultPrinter = printerList.find((p) => p.isDefault) || printerList[0];
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        }
      }
    } catch {
      toast.error('Printer scan failed.', { id: toastId });
    } finally {
      setScanning(false);
    }
  }, [setSelectedPrinter]);

  useEffect(() => {
    handleScan();
    
    fetch('/api/tenant/settings')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setPaymentMethods(res.data.paymentMethods || []);
        }
      })
      .catch(() => {});
  }, [handleScan]);

  const validateTitle = (val) => /^[a-zA-Z\s]+$/.test(val);
  const validateNumber = (val) => {
    if (methodType === 'EASYPAISA' || methodType === 'JAZZCASH') {
      return /^03\d{9}$/.test(val);
    }
    if (methodType === 'BANK' && !val && iban) return true;
    return /^[0-9]+$/.test(val) && val.length >= 5;
  };
  const validateIban = (val) => {
    if (methodType === 'BANK' && !accountNumber) {
      return /^[a-zA-Z0-9]+$/.test(val.replace(/\s+/g, ''));
    }
    if (!val) return true;
    return /^[a-zA-Z0-9]+$/.test(val.replace(/\s+/g, ''));
  };

  const getFieldStatus = (name, val) => {
    if (!touchedFields[name]) return 'idle';
    if (name === 'displayName') return val.trim().length >= 3 ? 'valid' : 'invalid';
    if (name === 'accountTitle') return validateTitle(val) ? 'valid' : 'invalid';
    if (name === 'accountNumber') return validateNumber(val) ? 'valid' : 'invalid';
    if (name === 'iban') return validateIban(val) ? 'valid' : 'invalid';
    return 'idle';
  };

  const isFormValid = () => {
    if (displayName.trim().length < 3) return false;
    if (!validateTitle(accountTitle)) return false;
    if (!validateNumber(accountNumber)) return false;
    if (!validateIban(iban)) return false;
    if (methodType === 'BANK' && !accountNumber && !iban) return false;
    return true;
  };

  const saveToBackend = async (updatedList) => {
    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethods: updatedList })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentMethods(data.data.paymentMethods || []);
        return true;
      } else {
        toast.error(data.error || 'Failed to update database settings');
        return false;
      }
    } catch {
      toast.error('Network error saving settings');
      return false;
    }
  };

  const handleTypeChange = (type) => {
    setMethodType(type);
    setTouchedFields({});
    if (type === 'EASYPAISA') {
      setDisplayName('EasyPaisa Gateway');
      setLogoPreset('easypaisa-logo');
    } else if (type === 'JAZZCASH') {
      setDisplayName('JazzCash Gateway');
      setLogoPreset('jazzcash-logo');
    } else if (type === 'BANK') {
      setDisplayName('Bank Gateway');
      setLogoPreset('bank-generic');
    } else {
      setDisplayName('Other Card Gateway');
      setLogoPreset('card-generic');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Please fix form validation errors before saving.');
      return;
    }

    const payload = {
      type: methodType,
      displayName,
      accountTitle,
      accountNumber,
      iban: methodType === 'BANK' ? iban : '',
      isActive,
      logoPreset
    };

    let newList;
    if (editingId) {
      newList = paymentMethods.map(m => m.id === editingId ? { ...m, ...payload } : m);
    } else {
      newList = [...paymentMethods, { ...payload, id: crypto.randomUUID() }];
    }

    const success = await saveToBackend(newList);
    if (success) {
      toast.success(editingId ? 'Payment gateway updated successfully!' : 'Payment gateway added successfully!');
      resetForm();
    }
  };

  const handleToggleActive = async (id, currentVal) => {
    const newList = paymentMethods.map(m => m.id === id ? { ...m, isActive: !currentVal } : m);
    const success = await saveToBackend(newList);
    if (success) {
      toast.success('Payment gateway status updated successfully!');
    }
  };

  const handleDelete = async (id) => {
    const newList = paymentMethods.filter(m => m.id !== id);
    const success = await saveToBackend(newList);
    if (success) {
      toast.success('Payment gateway removed successfully!');
      if (editingId === id) resetForm();
    }
  };

  const handleEditInit = (item) => {
    setEditingId(item.id);
    setMethodType(item.type);
    setDisplayName(item.displayName);
    setAccountTitle(item.accountTitle);
    setAccountNumber(item.accountNumber || '');
    setIban(item.iban || '');
    setIsActive(item.isActive);
    setLogoPreset(item.logoPreset || 'easypaisa-logo');
    setTouchedFields({});
  };

  const resetForm = () => {
    setEditingId(null);
    setMethodType('EASYPAISA');
    setDisplayName('EasyPaisa Gateway');
    setAccountTitle('');
    setAccountNumber('');
    setIban('');
    setIsActive(true);
    setLogoPreset('easypaisa-logo');
    setTouchedFields({});
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      toast.error('No printer selected');
      return;
    }
    toast.success(`Sent test print command to ${selectedPrinter}`);
  };

  const maskNumber = (num) => {
    if (!num) return '';
    if (num.length <= 4) return '****';
    return num.slice(0, 4) + '****' + num.slice(-3);
  };

  const getInputClass = (status) => {
    const base = "w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
    if (status === 'valid') return `${base} border-emerald-500 focus:ring-emerald-500/30 text-foreground`;
    if (status === 'invalid') return `${base} border-red-500 focus:ring-red-500/30 text-foreground`;
    return `${base} border-border text-foreground`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 p-4 md:p-6 w-full space-y-5">
        <div>
          <h1 className="text-lg font-bold tracking-tight">System Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage connection setups, printing profiles, and merchant payment gateways</p>
        </div>

        {activeTab === 'printer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
            
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Hardware Connection</h2>
                <p className="text-[10px] text-muted-foreground">Select local POS hardware components</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-lg">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Local Receipt Printer</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedPrinter ? `Selected: ${selectedPrinter}` : 'No printer connected'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-border bg-card hover:bg-muted px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer text-foreground shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
                  <span>Scan Devices</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground">Available Devices</label>
                <select
                  value={selectedPrinter || ''}
                  onChange={(e) => setSelectedPrinter(e.target.value || null)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No printer connected</option>
                  {printers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.isDefault ? '(System Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Print Tester</h2>
                <p className="text-[10px] text-muted-foreground">Verify hardware connection by sending a diagnostic test sheet</p>
              </div>

              <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="h-10 w-10 text-muted-foreground/60" />
                <div>
                  <h4 className="text-xs font-bold">Diagnostic Receipt Format</h4>
                  <p className="text-[10px] text-muted-foreground">Outputs formatting variables, fonts, and local hardware status details</p>
                </div>
                <button
                  onClick={handleTestPrint}
                  className="bg-primary text-primary-foreground hover:opacity-95 border border-primary-foreground/30 font-bold rounded-lg px-4 py-2 text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Test Receipt</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'wallet' && user?.niche === 'RESTAURANT' && (
          <div className="w-full border border-border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col md:flex-row gap-0">
            
            <div className="w-full md:w-[38%] border-b md:border-b-0 md:border-r border-border bg-muted/10 p-5 space-y-4">
              <div>
                <h2 className="text-sm font-black tracking-tight text-foreground">Payment Gateways</h2>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Dynamic gateways active for guest mobile orders</p>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No payment gateways configured yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-3 relative">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase ${
                            item.type === 'EASYPAISA' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            item.type === 'JAZZCASH' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                            item.type === 'BANK' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                            'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                          }`}>
                            {item.type}
                          </span>
                          
                          <button
                            onClick={() => handleToggleActive(item.id, item.isActive)}
                            className="text-foreground transition-all cursor-pointer"
                          >
                            {item.isActive ? (
                              <ToggleRight className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-foreground">{item.displayName}</h4>
                          <p className="text-[9px] text-muted-foreground">Title: <span className="font-bold text-foreground">{item.accountTitle}</span></p>
                          {item.accountNumber && (
                            <p className="text-[9px] text-muted-foreground font-mono">Number: <span className="font-bold text-foreground">{maskNumber(item.accountNumber)}</span></p>
                          )}
                          {item.iban && (
                            <p className="text-[8px] text-muted-foreground truncate font-mono">IBAN: <span className="font-bold text-foreground">{item.iban}</span></p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 border-t border-border/60 pt-2">
                        <button
                          onClick={() => handleEditInit(item)}
                          className="p-1 rounded border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded border border-red-500/10 hover:bg-red-500/5 text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-[62%] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div>
                  <h2 className="text-sm font-black tracking-tight text-foreground">
                    {editingId ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
                  </h2>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Setup gateway parameters and validation rules</p>
                </div>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">Gateway Type</label>
                  <select
                    value={methodType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="EASYPAISA">EasyPaisa</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="BANK">Bank Wire Transfer</option>
                    <option value="OTHER">Other Method</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">Display Name *</label>
                  <input
                    type="text"
                    value={displayName}
                    onFocus={() => setTouchedFields(prev => ({ ...prev, displayName: true }))}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={getInputClass(getFieldStatus('displayName', displayName))}
                    placeholder="e.g. My EasyPaisa"
                  />
                  {getFieldStatus('displayName', displayName) === 'invalid' && (
                    <p className="text-[9px] text-red-500 font-bold">Must be at least 3 characters long</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">Account Title *</label>
                  <input
                    type="text"
                    value={accountTitle}
                    onFocus={() => setTouchedFields(prev => ({ ...prev, accountTitle: true }))}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    className={getInputClass(getFieldStatus('accountTitle', accountTitle))}
                    placeholder="e.g. John Doe"
                  />
                  {getFieldStatus('accountTitle', accountTitle) === 'invalid' && (
                    <p className="text-[9px] text-red-500 font-bold font-mono">Title contains letters and spaces only</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    Account / Mobile Number {methodType === 'BANK' ? '(Optional if IBAN exists)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onFocus={() => setTouchedFields(prev => ({ ...prev, accountNumber: true }))}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className={getInputClass(getFieldStatus('accountNumber', accountNumber))}
                    placeholder={methodType === 'EASYPAISA' || methodType === 'JAZZCASH' ? "e.g. 03001234567" : "e.g. 10203040"}
                  />
                  {getFieldStatus('accountNumber', accountNumber) === 'invalid' && (
                    <p className="text-[9px] text-red-500 font-bold">
                      {methodType === 'EASYPAISA' || methodType === 'JAZZCASH'
                        ? 'Must match standard 11-digit mobile schema (03XXXXXXXXX)'
                        : 'Must be digits (5-20 chars)'}
                    </p>
                  )}
                </div>

                {methodType === 'BANK' && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      Bank Account IBAN {accountNumber ? '(Optional)' : '*'}
                    </label>
                    <input
                      type="text"
                      value={iban}
                      onFocus={() => setTouchedFields(prev => ({ ...prev, iban: true }))}
                      onChange={(e) => setIban(e.target.value)}
                      className={getInputClass(getFieldStatus('iban', iban))}
                      placeholder="e.g. PK00HABB0000123456789012"
                    />
                    {getFieldStatus('iban', iban) === 'invalid' && (
                      <p className="text-[9px] text-red-500 font-bold">Must be a valid alphanumeric code (mandatory if Account number is missing)</p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground">Preset Logo Preset</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'easypaisa-logo', label: 'EasyPaisa' },
                      { key: 'jazzcash-logo', label: 'JazzCash' },
                      { key: 'bank-generic', label: 'Bank' },
                      { key: 'card-generic', label: 'Other Card' }
                    ].map((l) => (
                      <button
                        type="button"
                        key={l.key}
                        onClick={() => setLogoPreset(l.key)}
                        className={`py-1.5 text-[8px] font-black border uppercase rounded-lg transition-all cursor-pointer ${
                          logoPreset === l.key
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/10">
                  <span className="text-[10px] font-bold text-muted-foreground">Enable Gateway Immediately</span>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="text-foreground transition-all cursor-pointer"
                  >
                    {isActive ? (
                      <ToggleRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="w-full bg-primary text-primary-foreground hover:opacity-95 font-bold rounded-lg py-2.5 text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{editingId ? 'Update Gateway Setup' : 'Save Gateway Setup'}</span>
                </button>
              </form>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default SettingsPage;
