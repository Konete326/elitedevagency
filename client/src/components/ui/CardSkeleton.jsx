export const CardSkeleton = ({ count = 6 }) => {
  const items = Array.from({ length: count });

  return (
    <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
      {items.map((_, idx) => (
        <div
          key={idx}
          className="p-4 border border-border dark:border-zinc-700 rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 flex flex-col justify-between space-y-4 animate-pulse"
        >
          <div className="space-y-3">
            <div className="h-24 bg-[var(--border)]/40 rounded-lg w-full" />
            <div className="flex items-center justify-between">
              <div className="h-3 bg-[var(--border)]/40 rounded w-1/2" />
              <div className="h-3 bg-[var(--border)]/40 rounded w-1/4" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2 bg-[var(--border)]/40 rounded w-full" />
              <div className="h-2 bg-[var(--border)]/40 rounded w-5/6" />
            </div>
          </div>
          <div className="h-8 bg-[var(--border)]/40 rounded-lg w-full" />
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
