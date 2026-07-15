import { useState } from 'react';
import { useSuperAdminLogs, useClearSuperAdminLogs, useDeleteSingleLog, useTenants } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clipboard, Trash2, ArrowLeft, RefreshCw, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModalStore } from '../../../store/useModalStore';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

export const SystemLogs = () => {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const [filters, setFilters] = useState({
    tenantId: '',
    userEmail: '',
    message: '',
    type: '',
    url: '',
    page: 1,
    limit: 5
  });

  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading, refetch, isFetching } = useSuperAdminLogs(filters);
  const { data: tenantsData } = useTenants(1, 100);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Logs list updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to refresh logs');
    }
  };
  const clearMutation = useClearSuperAdminLogs();
  const deleteMutation = useDeleteSingleLog();

  const onboardedTenants = tenantsData?.data || [];
  const logs = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  const tenantOptions = [...new Set([
    'PUBLIC',
    ...onboardedTenants.map(t => t._id),
    ...logs.map(log => log.tenantId)
  ])].filter(Boolean);

  const emailOptions = [...new Set([
    ...onboardedTenants.map(t => t.ownerEmail),
    ...logs.map(log => log.userEmail)
  ])].filter(Boolean);

  const handleClearLogs = () => {
    openModal({
      title: 'Clear Logs Database',
      message: 'Are you sure you want to permanently clear all logs? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Clear All',
      onConfirm: async () => {
        try {
          await clearMutation.mutateAsync();
          toast.success('Logs database successfully cleared');
          refetch();
        } catch (error) {
          toast.error(error.message || 'Failed to clear logs');
        }
      }
    });
  };

  const handleDeleteLog = (logId) => {
    openModal({
      title: 'Delete Log Entry',
      message: 'Are you sure you want to delete this log entry?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(logId);
          toast.success('Log entry deleted successfully');
          refetch();
        } catch (error) {
          toast.error(error.message || 'Failed to delete log');
        }
      }
    });
  };

  const copyToClipboard = (log) => {
    const text = `Type: ${log.type}\nMessage: ${log.message}\nStack: ${log.stack || 'No stack trace available'}\nURL: ${log.url}\nBrowser: ${log.browserInfo}`;
    navigator.clipboard.writeText(text);
    toast.success('Diagnostic details copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-zinc-700 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/superadmin')}
            className="flex items-center justify-center p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground dark:text-white">
              System Logs
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Monitor, filter, and purge global application exceptions and warnings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-card hover:bg-muted px-2.5 py-1.5 text-xs font-bold transition-colors text-foreground cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearLogs}
            disabled={clearMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-755 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Logs Database</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-0 rounded-lg border border-border dark:border-zinc-700 bg-card overflow-hidden divide-y divide-border md:divide-y-0 md:divide-x divide-border dark:divide-zinc-700 shadow-xs">
        <div className="col-span-6 md:col-span-2 p-2 flex flex-col justify-center">
          <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Tenant</label>
          <input
            list="tenants-list"
            type="text"
            placeholder="Tenant ID..."
            value={filters.tenantId}
            onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value, page: 1 }))}
            className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
          />
          <datalist id="tenants-list">
            {tenantOptions.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </datalist>
        </div>

        <div className="col-span-6 md:col-span-2 p-2 flex flex-col justify-center">
          <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">User Email</label>
          <input
            list="emails-list"
            type="text"
            placeholder="User Email..."
            value={filters.userEmail}
            onChange={(e) => setFilters(prev => ({ ...prev, userEmail: e.target.value, page: 1 }))}
            className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
          />
          <datalist id="emails-list">
            {emailOptions.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </datalist>
        </div>

        <div className="col-span-12 md:col-span-3 p-2 flex flex-col justify-center">
          <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Message</label>
          <input
            type="text"
            placeholder="Search Message..."
            value={filters.message}
            onChange={(e) => setFilters(prev => ({ ...prev, message: e.target.value, page: 1 }))}
            className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
          />
        </div>

        <div className="col-span-6 md:col-span-2 p-2 flex flex-col justify-center">
          <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Log Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
            className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200 cursor-pointer"
          >
            <option value="">All Logs</option>
            <option value="ERROR">Errors</option>
            <option value="WARNING">Warnings</option>
          </select>
        </div>

        <div className="col-span-6 md:col-span-3 p-2 flex flex-col justify-center">
          <label className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">URL Search</label>
          <input
            type="text"
            placeholder="Filter by page URL..."
            value={filters.url}
            onChange={(e) => setFilters(prev => ({ ...prev, url: e.target.value, page: 1 }))}
            className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton cols={5} rows={10} />
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[40rem]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-3 w-24">Type</th>
                  <th className="p-3 w-40">Tenant/User</th>
                  <th className="p-3">Message</th>
                  <th className="p-3 w-36">Time</th>
                  <th className="p-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-muted-foreground font-semibold">
                      No diagnostic records found matching search filters
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
                      <td className="p-2.5">
                        <div className="font-bold text-[10px] text-foreground font-mono truncate max-w-[140px]" title={log.tenantId}>
                          {log.tenantId}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[140px]" title={log.userEmail}>
                          {log.userEmail}
                        </div>
                      </td>
                      <td className="p-2.5 max-w-[200px] truncate font-medium text-slate-700 dark:text-zinc-300" title={log.message}>
                        {log.message}
                      </td>
                      <td className="p-2.5 text-[10px] font-medium text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1 rounded border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(log)}
                            className="p-1 rounded border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="Copy Diagnostics"
                          >
                            <Clipboard className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log._id)}
                            className="p-1 rounded border border-border bg-background hover:bg-red-50 dark:hover:bg-red-955/20 text-slate-500 hover:text-red-650 dark:hover:text-red-405 transition-colors cursor-pointer"
                            title="Delete Log"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border bg-muted/20 text-[10px] font-bold text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }))}
                className="rounded border border-border bg-background px-1.5 py-0.5 focus:outline-none"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-3">
              <span>Page {meta.page} of {totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="rounded border border-border bg-card px-2 py-1 hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="rounded border border-border bg-card px-2 py-1 hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg max-w-2xl w-full shadow-lg overflow-hidden flex flex-col font-semibold">
            <div className="p-3 border-b border-border dark:border-zinc-700 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/20">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  selectedLog.type === 'ERROR' 
                    ? 'bg-red-500/10 text-red-650 dark:text-red-400' 
                    : 'bg-amber-500/10 text-amber-650 dark:text-amber-400'
                }`}>
                  {selectedLog.type}
                </span>
                <h3 className="text-xs font-bold text-foreground dark:text-white">Diagnostic Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh] text-xs font-semibold text-foreground">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Tenant ID</span>
                  <span className="font-mono">{selectedLog.tenantId}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">User Email</span>
                  <span>{selectedLog.userEmail}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 col-span-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Page URL</span>
                  <span className="break-all font-mono">{selectedLog.url}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 col-span-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">User Agent (Browser)</span>
                  <span className="break-all font-mono">{selectedLog.browserInfo}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 col-span-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Logged Timestamp</span>
                  <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Error Message</span>
                <div className="p-2 rounded bg-red-500/5 text-red-650 dark:text-red-400 font-mono text-[11px] border border-red-500/10 break-words">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.stack && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Execution Callstack</span>
                  <pre className="p-2 rounded bg-zinc-900 text-zinc-100 font-mono text-[10px] border border-zinc-950 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-text">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border dark:border-zinc-700 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-800/10">
              <button
                onClick={() => copyToClipboard(selectedLog)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer text-foreground"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span>Copy Details</span>
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;
