export const StatCard = ({ label, value, sub, icon: Icon }) => (
  <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm flex items-start gap-4 transition-all duration-300 hover:border-accent-niche/40 hover:shadow-lg hover:-translate-y-0.5">
    <div className="p-3 bg-accent-niche/10 border border-accent-niche/20 text-accent-niche rounded-xl flex-shrink-0 transition-colors duration-300 group-hover:bg-accent-niche/20">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);
