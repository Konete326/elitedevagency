import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ShoppingBag, Coffee, ArrowRight, CheckCircle, Clock, 
  Send
} from 'lucide-react';

export const TableMenu = () => {
  const { tenantId, tableId } = useParams();
  
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem(`customerName_${tableId}`) || '';
  });
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem(`sessionId_${tableId}`) || '';
  });
  const [session, setSession] = useState(null);
  
  const [businessName, setBusinessName] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [localCart, setLocalCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  
  const [onboardingName, setOnboardingName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(900);
  const [timerStopped, setTimerStopped] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(10);
  const [feedbackComments, setFeedbackComments] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const [confirmTimeLeft, setConfirmTimeLeft] = useState(3600);
  
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const handlePaidReset = useCallback(() => {
    setCheckoutComplete(true);
    localStorage.removeItem(`customerName_${tableId}`);
    localStorage.removeItem(`sessionId_${tableId}`);
    if (sessionId) {
      localStorage.removeItem(`timerEnd_${sessionId}`);
      localStorage.removeItem(`timerStopped_${sessionId}`);
      localStorage.removeItem(`confirmEnd_${sessionId}`);
    }
    setCustomerName('');
    setSessionId('');
    setSession(null);
    setLocalCart([]);
  }, [tableId, sessionId]);

  const loadSession = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/table-order/session-status/${tenantId}/${id}`);
      const data = await res.json();
      if (data.success) {
        if (data.status === 'PAID') {
          handlePaidReset();
        } else {
          setWaitingConfirmation(data.status === 'WAITING_CONFIRMATION');
        }
      }
    } catch {
    }
  }, [tenantId, handlePaidReset]);

  useEffect(() => {
    if (!tenantId) return;
    
    fetch(`/api/table-order/tenant-settings/${tenantId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setBusinessName(res.data.businessName || 'Elite Restaurant');
          setPaymentConfig(res.data);
          const active = (res.data.paymentMethods || []).filter(m => m.isActive);
          if (active.length > 0) {
            setSelectedMethodId(active[0]._id);
            setPaymentMethod(active[0].customName);
          }
        }
      })
      .catch(() => {});

    fetch(`/api/table-order/menu/${tenantId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setProducts(res.data.products || []);
          setCategories(res.data.categories || []);
        }
      })
      .catch(() => {});
  }, [tenantId]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
      const pollInterval = setInterval(() => {
        loadSession(sessionId);
      }, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [sessionId, loadSession]);

  useEffect(() => {
    if (!sessionId) return;

    const timerEnd = localStorage.getItem(`timerEnd_${sessionId}`);
    const isStopped = localStorage.getItem(`timerStopped_${sessionId}`) === 'true';
    
    if (isStopped) {
      setTimerStopped(true);
      return;
    }

    let endTimestamp;
    if (timerEnd) {
      endTimestamp = parseInt(timerEnd, 10);
    } else {
      endTimestamp = Date.now() + 15 * 60 * 1000;
      localStorage.setItem(`timerEnd_${sessionId}`, String(endTimestamp));
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, timerStopped]);

  useEffect(() => {
    if (!waitingConfirmation || !sessionId) return;

    const confirmEnd = localStorage.getItem(`confirmEnd_${sessionId}`);
    let endTimestamp;
    if (confirmEnd) {
      endTimestamp = parseInt(confirmEnd, 10);
    } else {
      endTimestamp = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(`confirmEnd_${sessionId}`, String(endTimestamp));
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      setConfirmTimeLeft(remaining);
      if (remaining === 0) {
        setWaitingConfirmation(false);
        localStorage.removeItem(`waiting_confirmation_${sessionId}`);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [waitingConfirmation, sessionId]);

  const handleOnboarding = async (e) => {
    e.preventDefault();
    if (!onboardingName.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/table-order/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, tableId, customerName: onboardingName })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCustomerName(onboardingName);
        setSessionId(data.data._id);
        setSession(data.data);
        localStorage.setItem(`customerName_${tableId}`, onboardingName);
        localStorage.setItem(`sessionId_${tableId}`, data.data._id);
        toast.success(`Welcome, Table session initialized.`);
      } else {
        toast.error(data.error || 'Failed to start session');
      }
    } catch {
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setLocalCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item => 
          item.productId === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateCartQty = (productId, change) => {
    setLocalCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const submitCartOrder = async () => {
    if (localCart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/table-order/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, sessionId, items: localCart })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
        setLocalCart([]);
        toast.success('Order placed and sent to kitchen!');
      } else {
        toast.error(data.error || 'Failed to submit order');
      }
    } catch {
      toast.error('Network error placing order');
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = () => {
    setTimerStopped(true);
    setShowFeedback(true);
    if (sessionId) {
      localStorage.setItem(`timerStopped_${sessionId}`, 'true');
    }
  };

  const submitFeedbackRating = async () => {
    try {
      await fetch('/api/table-order/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          sessionId,
          feedbackScore,
          comments: feedbackComments
        })
      });
      toast.success('Thank you for your rating and feedback!');
      setShowFeedback(false);
    } catch {
      toast.error('Failed to save feedback');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!accountNumber) {
      toast.error('Account or reference details required');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/table-order/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          sessionId,
          method: paymentMethod,
          accountName,
          accountNumber,
          amount: paymentAmount || getSessionTotal()
        })
      });
      const data = await res.json();
      if (data.success) {
        setWaitingConfirmation(true);
        localStorage.setItem(`waiting_confirmation_${sessionId}`, 'true');
        toast.success('Payment submitted. Waiting for cashier approval.');
      } else {
        toast.error(data.error || 'Payment submission failed');
      }
    } catch {
      toast.error('Connection error submitting payment');
    } finally {
      setLoading(false);
    }
  };

  const getSessionTotal = () => {
    if (!session || !session.items) return 0;
    return session.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartTotal = () => {
    return localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.categoryId === selectedCategory);

  if (checkoutComplete) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full">
              <CheckCircle className="h-16 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Payment Received</h2>
            <p className="text-sm text-slate-400">
              Your transaction has been approved by the cashier. Thank you for dining with us!
            </p>
          </div>
          <button
            onClick={() => setCheckoutComplete(false)}
            className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 hover:opacity-95 transition-opacity cursor-pointer text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (waitingConfirmation) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full animate-pulse">
              <Clock className="h-16 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Waiting for Cashier Confirmation...</h2>
            <p className="text-sm text-slate-400">
              Please do not refresh this page. Your panel will automatically update once the cashier approves your manual wallet deposit.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 px-4 py-1.5 text-xs font-black">
              Expires in: {formatTime(confirmTimeLeft)}
            </div>
          </div>
          <div className="border border-slate-800 bg-slate-900 rounded-xl p-4 text-left text-xs text-slate-400 space-y-2">
            <div><span className="font-bold text-white">Guest:</span> {customerName}</div>
            <div><span className="font-bold text-white">Table:</span> {tableId}</div>
            <div><span className="font-bold text-white">Session Amount:</span> Rs. {getSessionTotal()}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!customerName) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleOnboarding} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-primary/10 text-primary rounded-xl">
              <Coffee className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white">{businessName}</h2>
            <p className="text-xs text-slate-400">Enter your name to link with Table {tableId} and claim session</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400">Your Name</label>
            <input
              type="text"
              required
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-3 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer text-sm"
          >
            <span>Start Ordering</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">{businessName}</h1>
            <p className="text-[10px] text-slate-400 font-bold">Table {tableId} • Guest: {customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'menu' ? 'bg-primary text-primary-foreground' : 'bg-slate-900 border border-slate-800 text-slate-350'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => {
              setActiveTab('checkout');
              setPaymentAmount(getSessionTotal());
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'checkout' ? 'bg-primary text-primary-foreground' : 'bg-slate-900 border border-slate-800 text-slate-350'
            }`}
          >
            Checkout
          </button>
        </div>
      </header>

      {session && session.items && session.items.length > 0 && (
        <div className="bg-slate-900/60 border-b border-slate-850 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary animate-pulse" />
            <span className="font-bold text-slate-300">Food Timer:</span>
            <span className="font-mono text-slate-200 font-bold">{formatTime(timeLeft)}</span>
          </div>

          {!timerStopped ? (
            <button
              onClick={stopTimer}
              className="rounded-lg bg-red-650 text-white font-bold px-3 py-1 hover:bg-red-700 transition-colors text-[10px] cursor-pointer"
            >
              Stop Timer (Food Served)
            </button>
          ) : (
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Timer Stopped</span>
            </span>
          )}
        </div>
      )}

      {showFeedback && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Rate Your Experience</h3>
            <span className="text-xs text-primary font-bold">{feedbackScore}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={feedbackScore}
            onChange={(e) => setFeedbackScore(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
          <textarea
            value={feedbackComments}
            onChange={(e) => setFeedbackComments(e.target.value)}
            placeholder="Tell us what you liked or how we can improve..."
            rows={2}
            className="w-full text-xs rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={submitFeedbackRating}
            className="w-full rounded-lg bg-primary text-primary-foreground font-black py-2 text-[10px] uppercase cursor-pointer"
          >
            Submit Review
          </button>
        </div>
      )}

      {activeTab === 'menu' ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-2/3 flex flex-col p-4 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === 'All' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-900 border border-slate-850 text-slate-400'
                }`}
              >
                All items
              </button>
              {categories.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === c._id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-900 border border-slate-850 text-slate-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <div key={product._id} className="rounded-xl border border-slate-850 bg-slate-900 p-3 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg bg-slate-950"
                      />
                    )}
                    <h4 className="text-xs font-bold text-white line-clamp-1">{product.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Rs. {product.price}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full rounded-lg bg-slate-800 text-white font-bold py-1.5 text-[10px] hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    Add Order
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-slate-850 bg-slate-900/40 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>My Pending Order Cart</span>
              </h3>

              {localCart.length > 0 ? (
                <div className="space-y-2.5">
                  {localCart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{item.name}</div>
                        <div className="text-[10px] text-slate-400">Rs. {item.price} each</div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => updateCartQty(item.productId, -1)}
                          className="w-5 h-5 rounded bg-slate-800 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-slate-200">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, 1)}
                          className="w-5 h-5 rounded bg-slate-800 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-350">New Order Total:</span>
                    <span className="text-white">Rs. {getCartTotal()}</span>
                  </div>
                  <button
                    onClick={submitCartOrder}
                    disabled={loading}
                    className="w-full rounded-xl bg-primary text-primary-foreground font-black py-2.5 text-xs uppercase hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    Send to Kitchen
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-bold py-6 text-center">
                  Your cart is empty. Tap menu items to build your selection.
                </p>
              )}

              {session && session.items && session.items.length > 0 && (
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">
                    Cumulative Locked Order List
                  </h4>
                  <div className="space-y-2">
                    {session.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {item.name} <span className="font-mono font-bold text-slate-400">x{item.quantity}</span>
                        </span>
                        <span className="text-slate-200 font-bold">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-slate-800 pt-2 flex justify-between text-xs font-bold text-white">
                    <span>Total Confirmed Due:</span>
                    <span>Rs. {getSessionTotal()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-black text-white">Wallet Payment</h3>
            <p className="text-xs text-slate-400">Pay manually via wallet transfer and confirm details below</p>
          </div>

          <div className="rounded-xl border border-slate-850 bg-slate-900 p-4 space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Merchant Wallet Info</h4>
            
            <div className="grid grid-cols-1 gap-3 text-xs">
              {(paymentConfig?.paymentMethods || []).filter(m => m.isActive).length > 0 ? (
                (paymentConfig.paymentMethods || []).filter(m => m.isActive).map((method) => (
                  <button
                    key={method._id}
                    type="button"
                    onClick={() => {
                      setSelectedMethodId(method._id);
                      setPaymentMethod(method.customName);
                    }}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedMethodId === method._id
                        ? 'border-primary bg-slate-850 shadow-sm'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider text-[10px]">{method.type}</div>
                      <div className="font-black text-slate-200 text-xs mt-0.5">{method.customName}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Title: <span className="font-bold text-slate-200">{method.accountTitle}</span></div>
                      {method.accountNumber && (
                        <div className="text-[10px] text-slate-400">Account #: <span className="font-bold text-slate-200 font-mono">{method.accountNumber}</span></div>
                      )}
                      {method.iban && (
                        <div className="text-[9px] text-slate-400 truncate">IBAN: <span className="font-bold text-slate-200 font-mono">{method.iban}</span></div>
                      )}
                    </div>
                    
                    {method.logo && (
                      <span className="px-2 py-1 rounded bg-slate-850 text-[9px] font-bold text-primary uppercase">
                        {method.logo}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <>
                  {paymentConfig?.easyPaisaNumber && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
                      <div>
                        <div className="font-bold text-slate-200">EasyPaisa Account</div>
                        <div className="text-[10px] text-slate-400">{paymentConfig.easyPaisaName}</div>
                      </div>
                      <div className="font-mono font-bold text-primary">{paymentConfig.easyPaisaNumber}</div>
                    </div>
                  )}
                  {paymentConfig?.jazzCashNumber && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
                      <div>
                        <div className="font-bold text-slate-200">JazzCash Account</div>
                        <div className="text-[10px] text-slate-400">{paymentConfig.jazzCashName}</div>
                      </div>
                      <div className="font-mono font-bold text-primary">{paymentConfig.jazzCashNumber}</div>
                    </div>
                  )}
                  {paymentConfig?.bankIban && (
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-200">Bank Transfer</span>
                        <span className="text-[10px] text-slate-400">{paymentConfig.bankName}</span>
                      </div>
                      <div className="font-mono font-bold text-primary text-[10px] break-all">{paymentConfig.bankIban}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="rounded-xl border border-slate-850 bg-slate-900 p-4 space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Submit Transfer Proof</h4>

            <div className="space-y-3 text-xs">
              {(paymentConfig?.paymentMethods || []).filter(m => m.isActive).length === 0 && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400">Payment Option</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold text-slate-400">Account Name Paid From</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-650"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-400">Account Number / Transaction ID</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 03001234567 or TRX12345"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-650"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-400">Amount Paid (Rs.)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount || getSessionTotal()}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || getSessionTotal() === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-black py-2.5 text-xs uppercase hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Payment Proof</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TableMenu;
