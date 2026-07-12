import { useState } from 'react';
import { useDiagnostics } from '../hooks/useSuperAdmin';
import { Database, Activity, Wifi, WifiOff, X, Clock, HardDrive, Cpu, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { AdminTable } from '../../../components/ui/AdminTable';
import { Link } from 'react-router-dom';

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
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-550 dark:text-zinc-400">
          <AlertTriangle className="h-3 w-3" />
          <span>No logs</span>
        </span>
      );
    }
    if (log.status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          <span>Healthy</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
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

  const renderRow = (tenant) => (
    <tr key={tenant.tenantId} className="hover:bg-muted/40 transition-colors">
      <td className="py-2 px-4 font-extrabold text-foreground dark:text-zinc-200">
        {tenant.businessName}
      </td>
      <td className="py-2 px-4">
        {tenant.dbStatus === 'Connected' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-450">
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-450">
            <WifiOff className="h-3 w-3" />
            <span>Unreachable</span>
          </span>
        )}
      </td>
      <td className="py-2 px-4">
        {getHealthBadge(tenant.latestLog)}
      </td>
      <td className="py-2 px-4 font-bold text-foreground/80 dark:text-zinc-350">
        {tenant.totalSynced.toLocaleString()}
      </td>
      <td className="py-2 px-4 text-right">
        <button
          onClick={() => setSelectedTenant(tenant)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-white text-slate-700 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-750 px-2 py-1 text-[10px] font-bold transition-colors shadow-sm"
        >
          <Database className="h-3 w-3 text-amber-600 dark:text-amber-500" />
          <span>View Analytics</span>
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-semibold">
      <div className="flex flex-row items-center justify-between gap-4 border-b border-border dark:border-zinc-700 pb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/superadmin"
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors border border-border dark:border-zinc-700"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
              System Sync Diagnostics
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Monitor database cluster connectivity and offline-first client replication states
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl shadow-lg">
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading system diagnostics...</p>
        </div>
      ) : (
        <AdminTable
          title="Connection & Synchronization Registry"
          description="Monitor database connection and sync status for registered clients"
          icon={Activity}
          headers={['Business Name', 'Database Status', 'Sync Health State', 'Total Synced Records', 'Analytics']}
          data={diagnostics}
          pageSize={7}
          renderRow={renderRow}
        />
      )}

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-semibold animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-lg w-full shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Sync Analytics</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedTenant.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last Sync Timestamp</p>
                    <p className="text-xs font-bold text-foreground dark:text-zinc-200 mt-0.5">
                      {formatDate(selectedTenant.latestLog?.timestamp)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <HardDrive className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data Transferred Size</p>
                    <p className="text-xs font-bold text-foreground dark:text-zinc-200 mt-0.5">
                      {formatBytes(selectedTenant.latestLog?.bytesTransferred)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <Cpu className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sync Processing Time</p>
                    <p className="text-xs font-bold text-foreground dark:text-zinc-200 mt-0.5">
                      {formatDuration(selectedTenant.latestLog?.durationMs)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-muted-foreground shrink-0">
                    <Database className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cloud Cluster Host</p>
                    <p className="text-xs font-bold text-foreground dark:text-zinc-200 mt-0.5">
                      {getHostIndicator(selectedTenant.dbURI)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end">
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 text-xs font-bold rounded-lg transition-opacity shadow-sm"
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
