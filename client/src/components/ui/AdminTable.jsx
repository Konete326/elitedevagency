import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminTable = ({
  title,
  description,
  icon: Icon,
  actionButton,
  headers = [],
  data = [],
  pageSize = 7,
  renderRow,
  renderGridItem,
  viewType = 'table' // 'table' | 'grid'
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4.5 w-4.5 text-[var(--accent)] shrink-0" />}
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actionButton && <div className="shrink-0">{actionButton}</div>}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-x-auto w-full">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2 p-5">
            <p className="text-xs font-bold text-foreground dark:text-white">No data available</p>
          </div>
        ) : viewType === 'grid' && renderGridItem ? (
          <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedData.map((item, index) => renderGridItem(item, startIndex + index))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[28rem]">
            <thead>
              <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className={`py-2.5 px-4 ${idx === headers.length - 1 ? 'text-right' : ''}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold">
              {paginatedData.map((item, index) => renderRow(item, startIndex + index))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/10 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-muted-foreground font-bold">
            Showing {startIndex + 1} - {Math.min(endIndex, data.length)} of {data.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-foreground dark:text-zinc-200 font-extrabold px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
