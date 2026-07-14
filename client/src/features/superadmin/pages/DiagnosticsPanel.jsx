import { useState } from 'react';
import { useDiagnostics, useUpdateTenant, useDeleteTenant } from '../hooks/useSuperAdmin';
import { Database, Activity, Wifi, WifiOff, X, Clock, HardDrive, Cpu, AlertTriangle, CheckCircle, ChevronLeft, Eye, Edit, Trash2 } from 'lucide-react';
import { AdminTable } from '../../../components/ui/AdminTable';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const DiagnosticsPanel = () => {
  const { data: diagnostics = [], isLoading } = useDiagnostics();
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    businessName: '',
    niche: 'GYM',
    plan: 'STARTER',
    dbURI: '',
    trialDays: 30
  });

  const updateTenantMutation = useUpdateTenant();
  const deleteTenantMutation = useDeleteTenant();

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

  const handleEditClick = (tenant) => {
    const start = tenant.createdAt ? new Date(tenant.createdAt) : new Date();
    const expiry = tenant.subscriptionExpiry ? new Date(tenant.subscriptionExpiry) : new Date();
    const calculatedDays = Math.max(0, Math.round((expiry - start) / (1000 * 60 * 60 * 24))) || 30;

    setEditingTenant(tenant);
    setEditForm({
      businessName: tenant.businessName,
      niche: tenant.niche || 'GYM',
      plan: tenant.plan || 'STARTER',
      dbURI: tenant.dbURI || '',
      trialDays: calculatedDays
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateTenantMutation.mutate(
      {
        tenantId: editingTenant.tenantId,
        updateData: {
          businessName: editForm.businessName,
          niche: editForm.niche,
          plan: editForm.plan,
          trialDays: parseInt(editForm.trialDays, 10) || 0,
          dbURI: editForm.dbURI
        }
      },
      {
        onSuccess: () => {
          toast.success('Tenant successfully updated');
          setEditingTenant(null);
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to update tenant');
        }
      }
    );
  };

  const handleDeleteClick = (tenant) => {
    if (window.confirm(`Are you absolutely sure you want to delete tenant "${tenant.businessName}"? This action is irreversible.`)) {
      deleteTenantMutation.mutate(tenant.tenantId, {
        onSuccess: () => {
          toast.success(`Tenant "${tenant.businessName}" deleted successfully`);
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to delete tenant');
        }
      });
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
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedTenant(tenant)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded transition-colors border border-border dark:border-zinc-700"
            title="View Sync Analytics"
          >
            <Eye className="h-3.5 w-3.5 text-blue-500" />
          </button>
          <button
            onClick={() => handleEditClick(tenant)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded transition-colors border border-border dark:border-zinc-700"
            title="Edit Tenant"
          >
            <Edit className="h-3.5 w-3.5 text-amber-500" />
          </button>
          <button
            onClick={() => handleDeleteClick(tenant)}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-700 rounded transition-colors border border-border dark:border-zinc-700"
            title="Delete Tenant"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
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
          headers={['Business Name', 'Database Status', 'Sync Health State', 'Total Synced Records', 'Actions']}
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

      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-semibold animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Edit Tenant Profile</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{editingTenant.businessName}</p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.businessName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Niche Category</label>
                    <select
                      value={editForm.niche}
                      onChange={(e) => setEditForm(prev => ({ ...prev, niche: e.target.value }))}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-bold text-foreground outline-none focus:outline-none"
                    >
                      <option value="GYM">Gym & Fitness Center</option>
                      <option value="RESTAURANT">Restaurant & Cafe</option>
                      <option value="GARMENTS">Garments & Retail Boutique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pricing Plan</label>
                    <input
                      type="text"
                      required
                      value={editForm.plan}
                      onChange={(e) => setEditForm(prev => ({ ...prev, plan: e.target.value }))}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-3">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Database Connection URI</label>
                    <input
                      type="text"
                      required
                      value={editForm.dbURI}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dbURI: e.target.value }))}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-mono font-semibold text-foreground focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Trial Days</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editForm.trialDays}
                      onChange={(e) => setEditForm(prev => ({ ...prev, trialDays: e.target.value }))}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 border border-border text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-750 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTenantMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 disabled:opacity-50 text-xs font-bold rounded-lg transition-opacity shadow-sm"
                >
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPanel;
