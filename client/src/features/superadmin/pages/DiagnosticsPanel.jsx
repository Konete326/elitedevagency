import { useState } from 'react';
import { useDiagnostics } from '../hooks/useSuperAdmin';
import { Database, Activity, Wifi, WifiOff, X, Clock, HardDrive, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';

export const DiagnosticsPanel = () => {
  const { data: diagnostics = [], isLoading } = useDiagnostics();
  const [selectedTenant, setSelectedTenant] = useState(null);

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null) return '0.0 KB';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDuration = (ms) => {
    if (ms === undefined || ms === null) return '0 ms';
    return `${ms} ms`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never Synced';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getHealthBadge = (log) => {
    if (!log) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-500">
          <AlertTriangle className="h-3 w-3" />
          <span>No logs</span>
        </span>
      );
    }
    if (log.status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          <span>Healthy</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/30 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-3 w-3" />
        <span>Failed</span>
      </span>
    );
  };

  const getHostIndicator = (uri) => {
    if (!uri) return 'Unknown Host';
    try {
      if (uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net')) {
        return 'MongoDB Atlas Cloud';
      }
      if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
        return 'Local Development Server';
      }
      const match = uri.match(/@([^/:]+)/);
      return match ? match[1] : 'External Server Node';
    } catch {
      return 'Generic Connection Node';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          System Sync Diagnostics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monitor database cluster connectivity and offline-first client replication states
        </p>
      </div>

      <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <span>Connection & Synchronization Registry</span>
          </h2>
        </div>

        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading system diagnostics...</p>
            </div>
          ) : diagnostics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6">
              <p className="text-sm font-semibold text-foreground">No Diagnostics Registered</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[50rem]">
              <thead>
                <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Database Status</th>
                  <th className="py-3 px-4">Sync Health State</th>
                  <th className="py-3 px-4">Total Synced Records</th>
                  <th className="py-3 px-4 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-zinc-700 text-sm font-semibold">
                {diagnostics.map((tenant) => (
                  <tr key={tenant.tenantId} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      {tenant.businessName}
                    </td>
                    <td className="py-3.5 px-4">
                      {tenant.dbStatus === 'Connected' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <Wifi className="h-3.5 w-3.5" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <WifiOff className="h-3.5 w-3.5" />
                          <span>Unreachable</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getHealthBadge(tenant.latestLog)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground/80">
                      {tenant.totalSynced.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white text-slate-700 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-750 px-2.5 py-1.5 text-xs font-bold transition-colors shadow-sm"
                      >
                        <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                        <span>View Analytics</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-semibold animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-lg w-full shadow-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border dark:border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-foreground">Sync Analytics</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedTenant.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Sync Timestamp</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {formatDate(selectedTenant.latestLog?.timestamp)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Transferred Size</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {formatBytes(selectedTenant.latestLog?.bytesTransferred)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sync Processing Time</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {formatDuration(selectedTenant.latestLog?.durationMs)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cloud Cluster Host</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {getHostIndicator(selectedTenant.dbURI)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end">
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-5 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 text-xs font-bold rounded-lg transition-opacity shadow-sm"
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

export default DiagnosticsPanel;
