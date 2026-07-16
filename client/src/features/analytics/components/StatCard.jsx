export const StatCard = ({ label, value, sub, icon: Icon }) => (
  <div className="group rounded-xl border border-border bg-card p-3 shadow-xs flex items-center gap-3 transition-colors hover:border-accent/30">
    <div className="p-2 bg-accent/10 border border-accent/15 text-accent rounded-lg flex-shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-lg font-black text-foreground tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-none">{sub}</p>}
    </div>
  </div>
);
