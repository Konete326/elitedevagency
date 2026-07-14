import { useState } from 'react';
import { useTenantLogs } from '../hooks/useTenantLogs';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clipboard, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

export const TenantLogs = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: '',
    page: 1,
    limit: 10
  });

  const { data, isLoading, refetch } = useTenantLogs(filters);

  const copyToClipboard = (log) => {
    const text = `Type: ${log.type}\nMessage: ${log.message}\nStack: ${log.stack || 'No stack trace available'}\nURL: ${log.url}\nBrowser: ${log.browserInfo}`;
    navigator.clipboard.writeText(text);
    toast.success('Diagnostic details copied to clipboard');
  };

  const logs = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Workspace Logs
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review exceptions and warnings generated inside your tenant workspace
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-3 py-2 text-xs font-bold transition-colors text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Log Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-semibold"
          >
            <option value="">All Logs</option>
            <option value="ERROR">Errors</option>
            <option value="WARNING">Warnings</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton cols={4} rows={8} />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-2.5 w-24">Type</th>
                  <th className="p-2.5">Message</th>
                  <th className="p-2.5 max-w-xs">URL</th>
                  <th className="p-2.5 w-36">Time</th>
                  <th className="p-2.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-muted-foreground font-semibold">
                    No diagnostic records found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                        log.type === 'ERROR' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {log.type === 'ERROR' ? <AlertCircle className="h-2.5 w-2.5" /> : <CheckCircle className="h-2.5 w-2.5" />}
                        {log.type}
                      </span>
                    </td>
                    <td className="p-2.5 max-w-md truncate font-medium text-slate-700 dark:text-zinc-350" title={log.message}>
                      {log.message}
                    </td>
                    <td className="p-2.5 max-w-xs truncate text-[11px] text-muted-foreground" title={log.url}>
                      {log.url}
                    </td>
                    <td className="p-2.5 text-[10px] font-medium text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => copyToClipboard(log)}
                        className="p-1 rounded border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title="Copy Diagnostics"
                      >
                        <Clipboard className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-muted/20 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }))}
              className="rounded border border-border bg-background px-2 py-1 focus:outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Page {meta.page} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                className="rounded border border-border bg-card px-2.5 py-1.5 hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                className="rounded border border-border bg-card px-2.5 py-1.5 hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default TenantLogs;
