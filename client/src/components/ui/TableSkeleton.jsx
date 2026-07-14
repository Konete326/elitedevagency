export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  const headerCols = Array.from({ length: cols });
  const tableRows = Array.from({ length: rows });

  return (
    <div className="w-full bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300">
      <div className="flex-1 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold uppercase tracking-wider animate-pulse">
              {headerCols.map((_, idx) => (
                <th key={idx} className="py-4 px-4">
                  <div className="h-2 bg-[var(--border)]/40 rounded w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold animate-pulse">
            {tableRows.map((_, rowIdx) => (
              <tr key={rowIdx}>
                {headerCols.map((_, colIdx) => (
                  <td key={colIdx} className="py-4 px-4">
                    <div className="h-2 bg-[var(--border)]/40 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
