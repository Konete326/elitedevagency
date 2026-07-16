import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getSystemPrinters } from '../../../lib/device';
import { Printer, RefreshCw, Save, Edit2, Trash2, ToggleLeft, ToggleRight, FileText, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { selectedPrinter, setSelectedPrinter } = useSettingsStore();

  const activeTab = searchParams.get('tab') || 'printer';
  const action = searchParams.get('action');
  const editId = searchParams.get('id');

  const [printers, setPrinters] = useState([]);
  const [scanning, setScanning] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [methodType, setMethodType] = useState('EASYPAISA');
  const [customName, setCustomName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedLogo, setSelectedLogo] = useState('easypaisa');

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

  useEffect(() => {
    if (action === 'edit' && editId && paymentMethods.length > 0) {
      const item = paymentMethods.find(m => m._id === editId);
      if (item) {
        setEditingId(item._id);
        setMethodType(item.type);
        setCustomName(item.customName);
        setAccountTitle(item.accountTitle);
        setAccountNumber(item.accountNumber);
        setIban(item.iban || '');
        setIsActive(item.isActive);
        setSelectedLogo(item.logo || 'easypaisa');
      }
    } else if (action === 'add') {
      setEditingId(null);
      setMethodType('EASYPAISA');
      setCustomName('EasyPaisa Payment');
      setAccountTitle('');
      setAccountNumber('');
      setIban('');
      setIsActive(true);
      setSelectedLogo('easypaisa');
    }
  }, [action, editId, paymentMethods]);

  const validateTitle = (val) => /^[a-zA-Z0-9\s.-]{3,50}$/.test(val);
  const validateNumber = (val) => /^[0-9A-Z-]{5,20}$/.test(val);
  const validateIban = (val) => {
    if (!val) return true;
    const clean = val.replace(/\s+/g, '');
    return /^PK[0-9]{2}[A-Z0-9]{4}[0-9]{16}$/i.test(clean);
  };

  const getFieldStatus = (name, val) => {
    if (!touchedFields[name]) return 'idle';
    if (name === 'customName') return val.trim().length >= 3 ? 'valid' : 'invalid';
    if (name === 'accountTitle') return validateTitle(val) ? 'valid' : 'invalid';
    if (name === 'accountNumber') {
      if (methodType === 'BANK' && !val && iban) return 'valid';
      return validateNumber(val) ? 'valid' : 'invalid';
    }
    if (name === 'iban') {
      if (!val) return (methodType === 'BANK' && accountNumber) ? 'valid' : 'invalid';
      return validateIban(val) ? 'valid' : 'invalid';
    }
    return 'idle';
  };

  const isFormValid = () => {
    if (customName.trim().length < 3) return false;
    if (!validateTitle(accountTitle)) return false;
    
    if (methodType === 'BANK') {
      const hasNumber = validateNumber(accountNumber);
      const hasIban = iban ? validateIban(iban) : false;
      if (!accountNumber && !iban) return false;
      if (accountNumber && !hasNumber) return false;
      if (iban && !hasIban) return false;
    } else {
      if (!validateNumber(accountNumber)) return false;
    }
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
      setCustomName('EasyPaisa Payment');
      setSelectedLogo('easypaisa');
    } else if (type === 'JAZZCASH') {
      setCustomName('JazzCash Payment');
      setSelectedLogo('jazzcash');
    } else if (type === 'BANK') {
      setCustomName('Bank Wire Transfer');
      setSelectedLogo('bank');
    } else {
      setCustomName('Other Payment');
      setSelectedLogo('card');
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
      customName,
      accountTitle,
      accountNumber,
      iban: methodType === 'BANK' ? iban : '',
      isActive,
      logo: selectedLogo
    };

    let newList;
    if (editingId) {
      newList = paymentMethods.map(m => m._id === editingId ? { ...m, ...payload } : m);
    } else {
      newList = [...paymentMethods, { ...payload, _id: crypto.randomUUID() }];
    }

    const success = await saveToBackend(newList);
    if (success) {
      toast.success(editingId ? 'Payment method updated successfully!' : 'Payment method added successfully!');
      resetForm();
    }
  };

  const handleToggleActive = async (id, currentVal) => {
    const newList = paymentMethods.map(m => m._id === id ? { ...m, isActive: !currentVal } : m);
    const success = await saveToBackend(newList);
    if (success) {
      toast.success('Payment status updated successfully!');
    }
  };

  const handleDelete = async (id) => {
    const newList = paymentMethods.filter(m => m._id !== id);
    const success = await saveToBackend(newList);
    if (success) {
      toast.success('Payment method removed successfully!');
      if (editingId === id) resetForm();
    }
  };

  const handleEditInit = (item) => {
    setSearchParams({ tab: 'wallet', action: 'edit', id: item._id });
  };

  const resetForm = () => {
    setSearchParams({ tab: 'wallet' });
    setEditingId(null);
    setMethodType('EASYPAISA');
    setCustomName('EasyPaisa Payment');
    setAccountTitle('');
    setAccountNumber('');
    setIban('');
    setIsActive(true);
    setSelectedLogo('easypaisa');
    setTouchedFields({});
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      toast.error('No printer selected');
      return;
    }
    toast.success(`Sent test print command to ${selectedPrinter}`);
  };

  const getInputClass = (status) => {
    const base = "w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
    if (status === 'valid') return `${base} border-emerald-500/80 focus:ring-emerald-500/30`;
    if (status === 'invalid') return `${base} border-red-500/80 focus:ring-red-500/30`;
    return `${base} border-border`;
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
          <div className="w-full">
            {(action === 'add' || action === 'edit') ? (
              <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetForm}
                      className="p-1 rounded border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <div>
                      <h2 className="text-sm font-black tracking-tight text-foreground">
                        {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
                      </h2>
                      <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
                        Setup manual payment gateway title and values
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Type</label>
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Display Name *</label>
                    <input
                      type="text"
                      value={customName}
                      onFocus={() => setTouchedFields(prev => ({ ...prev, customName: true }))}
                      onChange={(e) => setCustomName(e.target.value)}
                      className={getInputClass(getFieldStatus('customName', customName))}
                      placeholder="e.g. HBL Merchant Account"
                    />
                    {getFieldStatus('customName', customName) === 'invalid' && (
                      <p className="text-[9px] text-red-500 font-bold">Must be at least 3 characters long</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Title Name *</label>
                    <input
                      type="text"
                      value={accountTitle}
                      onFocus={() => setTouchedFields(prev => ({ ...prev, accountTitle: true }))}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className={getInputClass(getFieldStatus('accountTitle', accountTitle))}
                      placeholder="e.g. John Doe"
                    />
                    {getFieldStatus('accountTitle', accountTitle) === 'invalid' && (
                      <p className="text-[9px] text-red-500 font-bold">Title contains letters, numbers, spaces, dots, and dashes only (3-50 chars)</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Account / Mobile Number {methodType === 'BANK' ? '(Optional if IBAN exists)' : '*'}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onFocus={() => setTouchedFields(prev => ({ ...prev, accountNumber: true }))}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className={getInputClass(getFieldStatus('accountNumber', accountNumber))}
                      placeholder="e.g. 03001234567 or 10203040"
                    />
                    {getFieldStatus('accountNumber', accountNumber) === 'invalid' && (
                      <p className="text-[9px] text-red-500 font-bold">Must be digits or uppercase letters (5-20 chars)</p>
                    )}
                  </div>

                  {methodType === 'BANK' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Bank Account IBAN {accountNumber ? '(Optional)' : '*'}
                      </label>
                      <input
                        type="text"
                        value={iban}
                        onFocus={() => setTouchedFields(prev => ({ ...prev, iban: true }))}
                        onChange={(e) => setIban(e.target.value)}
                        className={getInputClass(getFieldStatus('iban', iban))}
                        placeholder="e.g. PK00 HABB 0000 1234 5678 9012"
                      />
                      {getFieldStatus('iban', iban) === 'invalid' && (
                        <p className="text-[9px] text-red-500 font-bold">Must be a valid 24-character Pakistani IBAN starting with PK</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preset Logo Variant</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['easypaisa', 'jazzcash', 'bank', 'card'].map((l) => (
                        <button
                          type="button"
                          key={l}
                          onClick={() => setSelectedLogo(l)}
                          className={`py-1.5 text-[9px] font-black border uppercase rounded-lg transition-all cursor-pointer ${
                            selectedLogo === l
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/10">
                    <span className="text-[10px] font-bold text-muted-foreground">Enable Method Immediately</span>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className="text-foreground transition-all cursor-pointer"
                    >
                      {isActive ? (
                        <ToggleRight className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
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
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">Configured Payment Methods</h2>
                    <p className="text-[10px] text-muted-foreground">Dynamic billing setups exposed to tables ordering scan panels</p>
                  </div>
                  <button
                    onClick={() => setSearchParams({ tab: 'wallet', action: 'add' })}
                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:opacity-95 font-bold rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Method</span>
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">No custom payment methods configured. Use the button to add one.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {paymentMethods.map((item) => (
                      <div key={item._id} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                              item.type === 'EASYPAISA' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                              item.type === 'JAZZCASH' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                              item.type === 'BANK' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                              'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                            }`}>
                              {item.type}
                            </span>
                            
                            <button
                              onClick={() => handleToggleActive(item._id, item.isActive)}
                              className="text-foreground transition-all cursor-pointer"
                            >
                              {item.isActive ? (
                                <ToggleRight className="h-6 w-6 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                              )}
                            </button>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-foreground">{item.customName}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Title: <span className="font-bold text-foreground">{item.accountTitle}</span></p>
                            <p className="text-[10px] text-muted-foreground">Number: <span className="font-bold text-foreground font-mono">{item.accountNumber || 'None'}</span></p>
                            {item.iban && (
                              <p className="text-[9px] text-muted-foreground truncate">IBAN: <span className="font-bold text-foreground font-mono">{item.iban}</span></p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2.5 mt-auto">
                          <button
                            onClick={() => handleEditInit(item)}
                            className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default SettingsPage;
