import { useState, useEffect } from 'react';
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getDatabase } from '../../../db/database';
import { printHardwareReceipt, printKOT } from '../../../lib/device';
import { Minus, Plus, Trash2, ShoppingBag, Printer, Coffee, Inbox, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const Cart = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getSubtotal,
    activeTableId,
    activeTableNo,
    activeOrderId
  } = useCartStore();
  const { user } = useAuthStore();
  const { selectedPrinter } = useSettingsStore();

  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [isHoldMode, setIsHoldMode] = useState(false);
  const [kotGroups, setKotGroups] = useState({});

  const [checkoutMode, setCheckoutMode] = useState('CASH');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.customers
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCustomers(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleCreateCustomerFromPOS = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    try {
      const db = await getDatabase();
      const customerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await db.customers.insert({
        _id: customerId,
        tenantId: user?.tenantId || 'default',
        name: newCustName,
        phone: newCustPhone,
        receivableBalance: 0,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });
      setSelectedCustomerId(customerId);
      setNewCustName('');
      setNewCustPhone('');
      setIsNewCustOpen(false);
      toast.success('Customer added successfully');
    } catch {
      toast.error('Failed to add customer');
    }
  };

  const handleKotClick = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const groups = {};
    cartItems.forEach((item) => {
      const section = item.kitchenSection || 'Main Kitchen';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(item);
    });

    setKotGroups(groups);
    setIsKotModalOpen(true);
  };

  const finalizeKOTFlow = () => {
    setIsKotModalOpen(false);
    if (isHoldMode) {
      setIsHoldMode(false);
      clearCart();
      navigate('/floor-map');
    }
  };

  const handlePrintSeparate = async () => {
    try {
      for (const [section, items] of Object.entries(kotGroups)) {
        const payload = {
          kitchenSection: section,
          items: items.map(item => ({
            name: item.isDeal 
              ? `${item.name} [Combo: ${(item.items || []).map(di => `${di.quantity}x ${di.name || 'Item'}`).join(', ')}]`
              : (item.selectedVariant 
                  ? `${item.name} (${item.selectedVariant.size}/${item.selectedVariant.color})`
                  : item.name),
            quantity: item.quantity,
            spiceLevel: item.spiceLevel || '',
            addons: (item.selectedAddons || []).map(a => a.name)
          })),
          timestamp: new Date().toISOString()
        };
        await printKOT(payload, 'SEPARATE');
      }
      toast.success('Separate KOTs sent to printer');
      finalizeKOTFlow();
    } catch {
      toast.error('Failed to print separate KOTs');
      finalizeKOTFlow();
    }
  };

  const handlePrintAllInOne = async () => {
    try {
      const payload = {
        groups: Object.entries(kotGroups).map(([section, items]) => ({
          kitchenSection: section,
          items: items.map(item => ({
            name: item.isDeal 
              ? `${item.name} [Combo: ${(item.items || []).map(di => `${di.quantity}x ${di.name || 'Item'}`).join(', ')}]`
              : (item.selectedVariant 
                  ? `${item.name} (${item.selectedVariant.size}/${item.selectedVariant.color})`
                  : item.name),
            quantity: item.quantity,
            spiceLevel: item.spiceLevel || '',
            addons: (item.selectedAddons || []).map(a => a.name)
          }))
        })),
        timestamp: new Date().toISOString()
      };
      await printKOT(payload, 'ALL_IN_ONE');
      toast.success('Combined KOT sent to printer');
      finalizeKOTFlow();
    } catch {
      toast.error('Failed to print combined KOT');
      finalizeKOTFlow();
    }
  };

  const subtotal = getSubtotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const getPromoPrice = (item) => {
    if (item.promotionalDiscount) {
      const { rate, price } = item.promotionalDiscount;
      if (rate && rate > 0) {
        return item.price * (1 - rate / 100);
      }
      if (price && price > 0) {
        return price;
      }
    }
    return item.price;
  };

  const handleHold = async () => {
    if (cartItems.length === 0) return;
    try {
      const db = await getDatabase();
      let orderId = activeOrderId;
      
      const orderDoc = {
        _id: orderId || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
        tenantId: user?.tenantId || 'default',
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: getPromoPrice(item),
          quantity: item.quantity,
          returnedQty: 0,
          returnReason: '',
          variantSku: item.selectedVariant ? item.selectedVariant.sku : '',
          spiceLevel: item.spiceLevel || '',
          isDeal: item.isDeal || false,
          selectedAddons: (item.selectedAddons || []).map(a => ({ name: a.name, price: a.price }))
        })),
        totalAmount: total,
        paymentMode: 'CASH',
        returnStatus: 'NONE',
        status: 'DRAFT',
        tableId: activeTableId,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      if (activeOrderId) {
        const existing = await db.orders.findOne(activeOrderId).exec();
        if (existing) {
          await existing.patch(orderDoc);
        } else {
          await db.orders.insert(orderDoc);
        }
      } else {
        await db.orders.insert(orderDoc);
        orderId = orderDoc._id;
      }

      const tableDoc = await db.tables.findOne(activeTableId).exec();
      if (tableDoc) {
        await tableDoc.patch({
          status: 'OCCUPIED',
          currentOrderId: orderId,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
      }

      const groups = {};
      cartItems.forEach((item) => {
        const section = item.kitchenSection || 'Main Kitchen';
        if (!groups[section]) {
          groups[section] = [];
        }
        groups[section].push(item);
      });
      setKotGroups(groups);
      setIsKotModalOpen(true);
      setIsHoldMode(true);
    } catch {
      toast.error('Failed to park order');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (checkoutMode === 'UDHAAR' && !selectedCustomerId) {
      toast.error('Please select a customer for credit checkout.');
      return;
    }

    try {
      const db = await getDatabase();
      let activeShiftDoc = null;

      if (checkoutMode === 'CASH') {
        activeShiftDoc = await db.cash_shifts.findOne({ selector: { status: 'OPEN', isDeleted: false } }).exec();
        if (!activeShiftDoc) {
          toast.error('Register is closed! Please open the cash register (Drawer) first before checking out with Cash.');
          return;
        }
      }

      const orderId = activeOrderId || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      
      const orderDoc = {
        _id: orderId,
        tenantId: user?.tenantId || 'default',
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: getPromoPrice(item),
          quantity: item.quantity,
          returnedQty: 0,
          returnReason: '',
          variantSku: item.selectedVariant ? item.selectedVariant.sku : '',
          spiceLevel: item.spiceLevel || '',
          isDeal: item.isDeal || false,
          selectedAddons: (item.selectedAddons || []).map(a => ({ name: a.name, price: a.price }))
        })),
        totalAmount: total,
        paymentMode: checkoutMode,
        paymentStatus: checkoutMode === 'UDHAAR' ? 'UNPAID' : 'PAID',
        returnStatus: 'NONE',
        status: 'COMPLETED',
        tableId: activeTableId || '',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      if (checkoutMode === 'CASH') {
        if (activeShiftDoc) {
          const curSales = activeShiftDoc.cashSales || 0;
          await activeShiftDoc.patch({
            cashSales: curSales + total,
            isSynced: false,
            updatedAt: new Date().toISOString()
          });
        }
      } else if (checkoutMode === 'UDHAAR') {
        const custDoc = await db.customers.findOne(selectedCustomerId).exec();
        if (custDoc) {
          const curBal = custDoc.receivableBalance || 0;
          await custDoc.patch({
            receivableBalance: curBal + total,
            isSynced: false,
            updatedAt: new Date().toISOString()
          });
        }
      }

      if (activeOrderId) {
        const existing = await db.orders.findOne(activeOrderId).exec();
        if (existing) {
          await existing.patch(orderDoc);
        } else {
          await db.orders.insert(orderDoc);
        }
      } else {
        await db.orders.insert(orderDoc);
      }

      if (activeTableId) {
        const tableDoc = await db.tables.findOne(activeTableId).exec();
        if (tableDoc) {
          await tableDoc.patch({
            status: 'AVAILABLE',
            currentOrderId: '',
            isSynced: false,
            updatedAt: new Date().toISOString()
          });
        }
      }

      for (const item of cartItems) {
        if (item.isDeal) {
          for (const dealItem of (item.items || [])) {
            const productDoc = await db.products.findOne(dealItem.productId).exec();
            if (productDoc) {
              const totalDecrement = dealItem.quantity * item.quantity;
              if (dealItem.variantSku) {
                const updatedVariants = (productDoc.variants || []).map((v) => {
                  if (v.sku === dealItem.variantSku) {
                    return { ...v, stock: Math.max(0, (v.stock || 0) - totalDecrement) };
                  }
                  return v;
                });
                await productDoc.patch({
                  variants: updatedVariants,
                  stock: Math.max(0, (productDoc.stock || 0) - totalDecrement),
                  isSynced: false,
                  updatedAt: new Date().toISOString()
                });
              } else {
                await productDoc.patch({
                  stock: Math.max(0, (productDoc.stock || 0) - totalDecrement),
                  isSynced: false,
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }
        } else {
          const productDoc = await db.products.findOne(item.id).exec();
          if (productDoc) {
            if (item.selectedVariant) {
              const updatedVariants = (productDoc.variants || []).map((v) => {
                if (v.sku === item.selectedVariant.sku) {
                  return { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) };
                }
                return v;
              });
              await productDoc.patch({
                variants: updatedVariants,
                stock: Math.max(0, (productDoc.stock || 0) - item.quantity),
                isSynced: false,
                updatedAt: new Date().toISOString()
              });
            } else {
              await productDoc.patch({
                stock: Math.max(0, (productDoc.stock || 0) - item.quantity),
                isSynced: false,
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
      }

      if (selectedPrinter) {
        try {
          await printHardwareReceipt({
            printerName: selectedPrinter,
            data: {
              orderId,
              items: cartItems.map((item) => {
                const itemPrice = getPromoPrice(item);
                return {
                  name: item.selectedVariant 
                    ? `${item.name} (${item.selectedVariant.size}/${item.selectedVariant.color})`
                    : item.name,
                  price: itemPrice,
                  quantity: item.quantity,
                  total: itemPrice * item.quantity
                };
              }),
              subtotal,
              tax,
              total,
              timestamp: new Date().toISOString()
            }
          });
        } catch (printErr) {
          console.error('Receipt print failed', printErr);
        }
      }

      toast.success('Order completed successfully');
      clearCart();
    } catch {
      toast.error('Failed to complete order');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 rounded-xl border border-border dark:border-zinc-700 overflow-hidden shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-zinc-700">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-base tracking-tight text-foreground">Active Cart</h2>
          </div>
          {activeTableNo && (
            <div className="flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black w-max">
              <Coffee className="h-3 w-3 shrink-0" />
              <span>Dining at Table {activeTableNo}</span>
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Your cart is currently empty</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.cartItemId}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-border dark:border-zinc-700"
            >
              <div className="flex-1 min-w-0 pr-3">
                <h4 className="text-sm font-bold truncate text-foreground">
                  {item.name}
                  {item.selectedVariant && (
                    <span className="text-[10px] text-muted-foreground font-semibold ml-1.5 uppercase tracking-wide">
                      ({item.selectedVariant.size}/{item.selectedVariant.color})
                    </span>
                  )}
                </h4>
                {(item.spiceLevel || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                  <div className="text-[10px] text-muted-foreground font-semibold font-mono space-x-1.5">
                    {item.spiceLevel && <span>Spice: {item.spiceLevel}</span>}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <span>Addons: {item.selectedAddons.map(a => a.name).join(', ')}</span>
                    )}
                  </div>
                )}
                {item.isDeal && item.items && item.items.length > 0 && (
                  <div className="text-[10px] text-muted-foreground font-semibold font-mono space-y-0.5 mt-0.5">
                    {item.items.map((di, idx) => (
                      <div key={idx}>• {di.quantity}x {di.name || 'Item'}</div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.promotionalDiscount ? (
                    <>
                      <span className="text-xs text-red-500 font-extrabold">${getPromoPrice(item).toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground line-through font-semibold">${item.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold">${item.price.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-extrabold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 space-y-4">
          <div className="space-y-1.5 text-sm font-semibold">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sales Tax (5%)</span>
              <span className="text-foreground font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold border-t border-border dark:border-zinc-700 pt-3 mt-2">
              <span>Total</span>
              <span className="text-accent font-black">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutMode('CASH')}
                className={`flex-1 py-2 text-center text-xs font-black rounded-lg border transition-all ${
                  checkoutMode === 'CASH'
                    ? 'bg-emerald-650 border-emerald-650 text-white shadow-sm font-bold'
                    : 'border-border bg-white dark:bg-zinc-800 text-foreground'
                }`}
              >
                CASH
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMode('UDHAAR')}
                className={`flex-1 py-2 text-center text-xs font-black rounded-lg border transition-all ${
                  checkoutMode === 'UDHAAR'
                    ? 'bg-red-600 border-red-600 text-white shadow-sm font-bold'
                    : 'border-border bg-white dark:bg-zinc-800 text-foreground'
                }`}
              >
                CREDIT
              </button>
            </div>

            {checkoutMode === 'UDHAAR' && (
              <div className="space-y-2 border border-dashed border-red-500/20 rounded-lg p-3 bg-red-500/5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Credit Customer *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustOpen(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 dark:text-red-400 hover:underline"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>New Account</span>
                  </button>
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-foreground outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {user?.niche === 'restaurant' && activeTableId ? (
              <>
                <button
                  onClick={handleHold}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-bold px-4 py-3 text-sm hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Inbox className="h-4 w-4" />
                  <span>Send to Kitchen (Hold)</span>
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-bold px-4 py-3 text-sm hover:opacity-90 transition-opacity shadow-sm"
                >
                  Checkout
                </button>
              </>
            ) : (
              <>
                {user?.niche === 'restaurant' && (
                  <button
                    onClick={handleKotClick}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-muted text-foreground font-bold px-4 py-3 text-sm transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print KOT</span>
                  </button>
                )}
                <button
                  onClick={handleCheckout}
                  className={`${user?.niche === 'restaurant' ? 'flex-1' : 'w-full'} inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-bold px-4 py-3 text-sm hover:opacity-90 transition-opacity shadow-sm`}
                >
                  Complete Order
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isKotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black tracking-tight mb-2 text-foreground">Print Kitchen Ticket (KOT)</h3>
            <p className="text-xs text-muted-foreground mb-6 font-semibold">Select the printing format for the kitchen staff:</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePrintSeparate}
                className="w-full rounded-lg bg-foreground text-background py-2.5 text-xs font-bold transition-colors"
              >
                Print Separate KOTs (BBQ, Fast Food, etc.)
              </button>
              <button
                onClick={handlePrintAllInOne}
                className="w-full rounded-lg border border-border dark:border-zinc-700 hover:bg-muted py-2.5 text-xs font-bold transition-colors text-foreground dark:hover:bg-zinc-700"
              >
                Print All-in-One KOT
              </button>
              <button
                onClick={finalizeKOTFlow}
                className="w-full rounded-lg border border-transparent py-2.5 text-xs font-bold transition-colors text-muted-foreground hover:text-foreground mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isNewCustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsNewCustOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <UserPlus className="h-5 w-5 text-red-500" /> New Credit Customer Onboard
            </h3>
            <form onSubmit={handleCreateCustomerFromPOS} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. Imran Khan"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 0321-7654321"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-red-600 text-white py-2.5 text-xs font-bold shadow-sm"
              >
                Register Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
