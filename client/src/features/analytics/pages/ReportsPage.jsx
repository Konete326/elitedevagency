import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useOrderAnalytics } from '../../../hooks/useOrderAnalytics';
import { StatCard } from '../components/StatCard';
import { TopProductsChart } from '../components/TopProductsChart';

const NICHE_LABELS = {
  gym: 'Gym',
  restaurant: 'Restaurant',
  garments: 'Garments',
};

const DATE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const DateRangeFilter = ({ value, onChange }) => (
  <div className="flex items-center gap-2.5">
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:block">
      Period
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer"
    >
      {DATE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6 h-28" />
      ))}
    </div>
    <div className="rounded-2xl border border-border bg-card p-6 h-72" />
  </div>
);

const ReportsHeader = ({ user, onBack }) => {
  const nicheLabel = user?.niche
    ? NICHE_LABELS[user.niche.toLowerCase()] ?? user.niche
    : null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-xl border border-border hover:bg-muted transition-colors text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <BarChart3 className="h-5 w-5 text-accent" />
        <span className="font-extrabold text-lg tracking-tight">Sales Analytics</span>
        {nicheLabel && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20">
            {nicheLabel}
          </span>
        )}
      </div>
      <div className="hidden sm:block text-right">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {user?.role}
        </p>
        <p className="text-sm font-black text-foreground">{user?.name}</p>
      </div>
    </header>
  );
};

const AnalyticsContent = ({ totalRevenue, totalOrders, avgOrderValue, topProducts, dateRange, onDateChange }) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Total Revenue"
        value={`Rs. ${totalRevenue.toFixed(2)}`}
        sub="All completed orders"
        icon={TrendingUp}
      />
      <StatCard
        label="Total Orders"
        value={totalOrders.toLocaleString()}
        sub="Transactions recorded"
        icon={ShoppingCart}
      />
      <StatCard
        label="Avg Order Value"
        value={`Rs. ${avgOrderValue.toFixed(2)}`}
        sub="Per transaction"
        icon={BarChart3}
      />
    </div>

    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Top 5 Selling Products</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            By units sold from local checkout data
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {totalOrders > 0 && (
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full tabular-nums">
              {totalOrders} order{totalOrders !== 1 ? 's' : ''}
            </span>
          )}
          <DateRangeFilter value={dateRange} onChange={onDateChange} />
        </div>
      </div>
      <TopProductsChart products={topProducts} />
    </div>
  </div>
);

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('all');

  const { totalRevenue, totalOrders, avgOrderValue, topProducts, isLoading } =
    useOrderAnalytics(dateRange);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <ReportsHeader user={user} onBack={() => navigate('/')} />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Performance Overview</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Calculated live from local offline data — syncs automatically when online.
              </p>
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>

          {isLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <AnalyticsContent
              totalRevenue={totalRevenue}
              totalOrders={totalOrders}
              avgOrderValue={avgOrderValue}
              topProducts={topProducts}
              dateRange={dateRange}
              onDateChange={setDateRange}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
