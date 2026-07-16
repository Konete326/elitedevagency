import { useState } from 'react';
import { TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { useOrderAnalytics } from '../../../hooks/useOrderAnalytics';
import { StatCard } from '../components/StatCard';
import { TopProductsChart } from '../components/TopProductsChart';

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



const AnalyticsContent = ({ totalRevenue, totalOrders, avgOrderValue, topProducts, dateRange, onDateChange }) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
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

    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold tracking-tight">Top 5 Selling Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-none">
            By units sold from local checkout data
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {totalOrders > 0 && (
            <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
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
  const [dateRange, setDateRange] = useState('all');

  const { totalRevenue, totalOrders, avgOrderValue, topProducts, isLoading } =
    useOrderAnalytics(dateRange);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-4 md:p-5 w-full space-y-4">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-base font-bold tracking-tight">Sales Analytics & Reports</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
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
