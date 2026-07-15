import { useState, useEffect, useMemo } from 'react';
import { useTenants, useToggleTenantLock, useToggleMobileAccess, useUpdateTenantFeatures, useToggleTenantSuspension, useDeleteTenant } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { Lock, Unlock, ChevronLeft, ChevronRight, Database, Layers, Shield, X, AlertTriangle, CheckCircle, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useModalStore } from '../../../store/useModalStore';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

export const TenantManager = ({ onEdit }) => {
  const { openModal } = useModalStore();
  const [page, setPage] = useState(1);
  const limit = 5;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get('view');

  const { data, isLoading } = useTenants(page, limit);
  const toggleLockMutation = useToggleTenantLock();
  const toggleMobileAccessMutation = useToggleMobileAccess();
  const updateFeaturesMutation = useUpdateTenantFeatures();
  const toggleSuspensionMutation = useToggleTenantSuspension();
  const deleteTenantMutation = useDeleteTenant();

  const [activeDropdownTenantId, setActiveDropdownTenantId] = useState(null);
  const [selectedTenantForView, setSelectedTenantForView] = useState(null);
  const [selectedTenantForFeatures, setSelectedTenantForFeatures] = useState(null);
  const [tempFeatures, setTempFeatures] = useState([]);

  const [selectedTenantForSuspension, setSelectedTenantForSuspension] = useState(null);
  const [suspensionState, setSuspensionState] = useState({
    isSuspended: false,
    suspensionTitle: '',
    suspensionDescription: ''
  });

  const tenants = useMemo(() => data?.data || [], [data?.data]);
  const meta = data?.meta || { total: 0 };
  const totalPages = Math.ceil(meta.total / limit) || 1;

  useEffect(() => {
    if (viewId && tenants.length > 0) {
      const matched = tenants.find(t => t._id === viewId);
      if (matched) {
        setSelectedTenantForView(matched);
      }
    }
  }, [viewId, tenants]);

  useEffect(() => {
    const handleCloseDropdown = () => setActiveDropdownTenantId(null);
    window.addEventListener('click', handleCloseDropdown);
    return () => window.removeEventListener('click', handleCloseDropdown);
  }, []);

  const handleToggleLock = (tenantId) => {
    toggleLockMutation.mutate(tenantId, {
      onSuccess: (updatedTenant) => {
        const action = updatedTenant.rentOverdue ? 'locked' : 'unlocked';
        toast.success(`Tenant "${updatedTenant.businessName}" has been ${action}!`);
      },
      onError: (error) => {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const handleToggleMobileAccess = (tenantId) => {
    toggleMobileAccessMutation.mutate(tenantId, {
      onSuccess: (updatedTenant) => {
        const action = updatedTenant.blockMobileAccess ? 'blocked' : 'allowed';
        toast.success(`Mobile access for "${updatedTenant.businessName}" has been ${action}!`);
      },
      onError: (error) => {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const handleEditClick = (tenant) => {
    if (onEdit) {
      onEdit(tenant);
    } else {
      navigate(`/superadmin/tenants/new?edit=${tenant._id}`);
    }
  };

  const handleDeleteClick = (tenant) => {
    openModal({
      type: 'danger',
      title: 'Delete Tenant Workspace',
      message: `This will permanently remove "${tenant.businessName}" and all associated configuration. This action cannot be undone.`,
      confirmText: 'Delete Tenant',
      cancelText: 'Cancel',
      onConfirm: () => {
        deleteTenantMutation.mutate(tenant._id, {
          onSuccess: () => {
            toast.success(`Tenant "${tenant.businessName}" deleted successfully`);
          },
          onError: (err) => {
            toast.error(err.message || 'Failed to delete tenant');
          }
        });
      }
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'None';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'STARTER':
        return 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400';
      case 'GROWTH':
        return 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400';
      case 'PRO':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/30 dark:text-indigo-400';
      case 'CUSTOM':
        return 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-zinc-50 border-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400';
    }
  };

  const maskURI = (uri) => {
    if (!uri) return '';
    return uri.replace(/:([^:@]+)@/, ':***@');
  };

  const getNicheBadgeClass = (niche) => {
    switch (niche) {
      case 'GYM':
        return 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400';
      case 'RESTAURANT':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-400';
      case 'GARMENTS':
        return 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-zinc-50 border-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400';
    }
  };

  return (
    <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
      <div className="py-3 px-5 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-amber-600 dark:text-amber-500" />
            <span>Onboarded Tenants</span>
            {!isLoading && meta.total > 0 && (
              <span className="text-[10px] bg-slate-200/80 dark:bg-zinc-750 px-2 py-0.5 rounded-full font-extrabold text-slate-600 dark:text-zinc-300">
                {meta.total} total
              </span>
            )}
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage databases, trials, licenses, and locking state</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full min-h-[300px]">
        {isLoading ? (
          <TableSkeleton cols={6} rows={6} />
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-muted-foreground p-6">
            <p className="text-xs font-semibold text-foreground">No Tenants Found</p>
            <p className="text-[10px] text-muted-foreground mt-1">Onboard your first customer to populate this table</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[56rem]">
            <thead>
              <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">Business Name</th>
                <th className="py-2 px-3">Niche</th>
                <th className="py-2 px-3">Plan</th>
                <th className="py-2 px-3">Database Path</th>
                <th className="py-2 px-3">Subscription End</th>
                <th className="py-2 px-3">License Status</th>
                <th className="py-2 px-3">Mobile Access</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold">
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2 px-3 font-extrabold text-foreground">
                    <div>{tenant.businessName}</div>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${getNicheBadgeClass(tenant.niche)}`}>
                      {tenant.niche}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${getPlanBadgeClass(tenant.plan)}`}>
                      {tenant.plan === 'CUSTOM' && tenant.customPlanName
                        ? `${tenant.customPlanName} (Rs. ${tenant.customPlanPrice})`
                        : (tenant.plan || 'STARTER')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[11px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-1 font-semibold">
                      <Database className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                      <span className="max-w-[11rem] truncate" title={tenant.databaseURI || tenant.dbURI}>
                        {maskURI(tenant.databaseURI || tenant.dbURI)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground/80">
                    {formatDate(tenant.subscriptionExpiry)}
                  </td>
                  <td className="py-2 px-3">
                    {tenant.rentOverdue ? (
                      <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-655 dark:text-red-400">
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-650 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMobileAccess(tenant._id);
                      }}
                      disabled={toggleMobileAccessMutation.isPending}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        tenant.blockMobileAccess ? 'bg-[var(--accent)]' : 'bg-slate-200 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          tenant.blockMobileAccess ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownTenantId(
                          activeDropdownTenantId === tenant._id ? null : tenant._id
                        );
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors border border-border dark:border-zinc-700"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeDropdownTenantId === tenant._id && (
                      <div className="absolute right-3 mt-1.5 w-44 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 py-1.5 shadow-lg z-50 text-left font-bold text-[11px] text-slate-650 dark:text-zinc-350">
                        <button
                          onClick={() => {
                            setSelectedTenantForView(tenant);
                            setActiveDropdownTenantId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            handleEditClick(tenant);
                            setActiveDropdownTenantId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                        >
                          <Edit className="h-3.5 w-3.5 text-amber-500" />
                          <span>Edit Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenantForFeatures(tenant);
                            setTempFeatures(tenant.features || []);
                            setActiveDropdownTenantId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                        >
                          <Layers className="h-3.5 w-3.5 text-indigo-550" />
                          <span>Manage Features</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenantForSuspension(tenant);
                            setSuspensionState({
                              isSuspended: tenant.isSuspended || false,
                              suspensionTitle: tenant.suspensionTitle || '',
                              suspensionDescription: tenant.suspensionDescription || ''
                            });
                            setActiveDropdownTenantId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                        >
                          <Shield className="h-3.5 w-3.5 text-orange-500" />
                          <span>Suspension Status</span>
                        </button>
                        <button
                          onClick={() => {
                            handleToggleLock(tenant._id);
                            setActiveDropdownTenantId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                        >
                          {tenant.rentOverdue ? (
                            <>
                              <Unlock className="h-3.5 w-3.5 text-green-500" />
                              <span>Unlock License</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5 text-red-500" />
                              <span>Lock (Kill) License</span>
                            </>
                          )}
                        </button>
                        <div className="border-t border-border dark:border-zinc-700 my-1"></div>
                        <button
                          onClick={() => {
                            handleDeleteClick(tenant);
                            setActiveDropdownTenantId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-455 transition-colors text-left"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Tenant</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="py-2.5 px-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground font-semibold">
            Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-md border border-border dark:border-zinc-700 px-2.5 py-1 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-zinc-750 disabled:opacity-50 disabled:pointer-events-none transition-colors text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-border dark:border-zinc-700 px-2.5 py-1 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-zinc-750 disabled:opacity-50 disabled:pointer-events-none transition-colors text-slate-700 dark:text-slate-200"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedTenantForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-semibold animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-lg w-full shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Tenant Workspace Details</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedTenantForView.businessName}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTenantForView(null);
                  setSearchParams({});
                }}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Business Name</p>
                  <p className="font-bold text-foreground dark:text-zinc-200">{selectedTenantForView.businessName}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Niche Category</p>
                  <p className="font-bold text-foreground dark:text-zinc-200">{selectedTenantForView.niche}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Subscription Plan</p>
                  <p className="font-bold text-foreground dark:text-zinc-200">{selectedTenantForView.plan}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Subscription Expiry</p>
                  <p className="font-bold text-foreground dark:text-zinc-200">{formatDate(selectedTenantForView.subscriptionExpiry)}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Database Connection URI</p>
                <p className="font-mono text-[10px] break-all font-semibold text-foreground dark:text-zinc-300">
                  {selectedTenantForView.databaseURI || selectedTenantForView.dbURI}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Lock / License Status</p>
                  <p className="font-bold">
                    {selectedTenantForView.rentOverdue ? (
                      <span className="text-red-500">Locked / Suspended</span>
                    ) : (
                      <span className="text-green-500">Active</span>
                    )}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Mobile/Tablet Access</p>
                  <p className="font-bold text-foreground dark:text-zinc-200">
                    {selectedTenantForView.blockMobileAccess ? 'Blocked' : 'Allowed'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Modules & Features Enabled</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTenantForView.activeModules?.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-[9px] font-black uppercase">
                      {m}
                    </span>
                  ))}
                  {selectedTenantForView.features?.map(f => (
                    <span key={f} className="px-2 py-0.5 bg-purple-500/10 text-purple-650 rounded text-[9px] font-black uppercase">
                      {f}
                    </span>
                  ))}
                  {(!selectedTenantForView.activeModules?.length && !selectedTenantForView.features?.length) && (
                    <span className="text-muted-foreground font-semibold text-[10px]">No extra modules enabled</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTenantForView(null);
                  setSearchParams({});
                }}
                className="px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 text-xs font-bold rounded-lg transition-opacity shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTenantForFeatures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-semibold animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-lg w-full shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Edit Tenant Features</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedTenantForFeatures.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedTenantForFeatures(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid gap-3 grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black tracking-wider text-slate-500 uppercase">Garments Features</h4>
                  <div className="space-y-2">
                    {['Barcode Printing', 'Size-Color Matrix'].map((feat) => {
                      const isChecked = tempFeatures.includes(feat);
                      return (
                        <label key={feat} className="flex items-center gap-2 text-xs cursor-pointer select-none font-bold text-foreground dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setTempFeatures((prev) =>
                                prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-border dark:border-zinc-755 text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span>{feat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 border-l border-border dark:border-zinc-700 pl-3">
                  <h4 className="text-[9px] font-black tracking-wider text-slate-500 uppercase">Restaurant Features</h4>
                  <div className="space-y-2">
                    {['Kitchen Order Ticket', 'Table Management'].map((feat) => {
                      const isChecked = tempFeatures.includes(feat);
                      return (
                        <label key={feat} className="flex items-center gap-2 text-xs cursor-pointer select-none font-bold text-foreground dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setTempFeatures((prev) =>
                                prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-border dark:border-zinc-755 text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span>{feat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 border-l border-border dark:border-zinc-700 pl-3">
                  <h4 className="text-[9px] font-black tracking-wider text-slate-500 uppercase">Gym Features</h4>
                  <div className="space-y-2">
                    {['BMI Tracker', 'Instructor Payroll'].map((feat) => {
                      const isChecked = tempFeatures.includes(feat);
                      return (
                        <label key={feat} className="flex items-center gap-2 text-xs cursor-pointer select-none font-bold text-foreground dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setTempFeatures((prev) =>
                                prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-border dark:border-zinc-755 text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span>{feat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTenantForFeatures(null)}
                className="px-4 py-2 border border-border text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-750 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateFeaturesMutation.mutate(
                    { tenantId: selectedTenantForFeatures._id, features: tempFeatures },
                    {
                      onSuccess: () => {
                        toast.success(`Features for "${selectedTenantForFeatures.businessName}" updated successfully!`);
                        setSelectedTenantForFeatures(null);
                      },
                      onError: (err) => {
                        toast.error(err.message || 'Failed to update features');
                      }
                    }
                  );
                }}
                disabled={updateFeaturesMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 text-xs font-bold rounded-lg transition-opacity disabled:opacity-50 shadow-sm"
              >
                {updateFeaturesMutation.isPending ? 'Saving...' : 'Save Features'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTenantForSuspension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-semibold animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Workspace Suspension Settings</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedTenantForSuspension.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedTenantForSuspension(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-900/40 rounded-lg border border-border dark:border-zinc-700">
                <span className="text-xs font-bold text-foreground dark:text-zinc-200">Subscription Tier</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${getPlanBadgeClass(selectedTenantForSuspension.plan)}`}>
                  {selectedTenantForSuspension.plan === 'CUSTOM' && selectedTenantForSuspension.customPlanName
                    ? `${selectedTenantForSuspension.customPlanName} (Rs. ${selectedTenantForSuspension.customPlanPrice.toLocaleString()})`
                    : (selectedTenantForSuspension.plan || 'STARTER')}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Custom Lock Title (Optional)</label>
                  <input
                    type="text"
                    value={suspensionState.suspensionTitle}
                    onChange={(e) => setSuspensionState(prev => ({ ...prev, suspensionTitle: e.target.value }))}
                    placeholder="Account Suspended"
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Custom Lock Description (Optional)</label>
                  <textarea
                    value={suspensionState.suspensionDescription}
                    onChange={(e) => setSuspensionState(prev => ({ ...prev, suspensionDescription: e.target.value }))}
                    placeholder="Your subscription workspace has been suspended. Please contact the administrator."
                    rows={3}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-transparent px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none font-semibold"
                  />
                </div>

                <div className="pt-1">
                  {suspensionState.isSuspended ? (
                    <button
                      type="button"
                      onClick={() => setSuspensionState(prev => ({ ...prev, isSuspended: false }))}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2 text-xs font-bold transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Activate Tenant Access</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSuspensionState(prev => ({ ...prev, isSuspended: true }))}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 py-2 text-xs font-bold transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Suspend Tenant Access</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTenantForSuspension(null)}
                className="px-4 py-2 border border-border text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-750 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleSuspensionMutation.mutate({
                    tenantId: selectedTenantForSuspension._id,
                    isSuspended: suspensionState.isSuspended,
                    suspensionTitle: suspensionState.suspensionTitle,
                    suspensionDescription: suspensionState.suspensionDescription
                  }, {
                    onSuccess: () => {
                      toast.success(`Account suspension status updated for "${selectedTenantForSuspension.businessName}"!`);
                      setSelectedTenantForSuspension(null);
                    },
                    onError: (err) => {
                      toast.error(err.message || 'Failed to update suspension status');
                    }
                  });
                }}
                disabled={toggleSuspensionMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 text-xs font-bold rounded-lg transition-opacity disabled:opacity-50 shadow-sm"
              >
                {toggleSuspensionMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManager;
