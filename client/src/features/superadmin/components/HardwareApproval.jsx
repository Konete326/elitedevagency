import { usePendingDevices, useApproveDevice } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { Check, X, ShieldAlert, Cpu } from 'lucide-react';

export const HardwareApproval = () => {
  const { data: devices = [], isLoading } = usePendingDevices();
  const approveDeviceMutation = useApproveDevice();

  const handleApprove = (deviceId, approve) => {
    approveDeviceMutation.mutate({ deviceId, approve }, {
      onSuccess: () => {
        toast.success(approve ? 'Device fingerprint approved' : 'Device fingerprint rejected');
      },
      onError: (error) => {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Hardware Approvals
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review and whitelist terminal hardware identifiers attempting system syncs
        </p>
      </div>

      <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <span>Pending Device Queue</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Verify and whitelist fingerprints for desktop client nodes</p>
        </div>

        <div className="flex-1 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading pending devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-2 p-6">
              <div className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 p-3 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Queue is Clear</p>
              <p className="text-xs text-muted-foreground text-center">All hardware login fingerprints have been processed</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[32rem]">
              <thead>
                <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Hardware Fingerprint (UUID/MAC)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-zinc-700 text-sm font-semibold">
                {devices.map((device) => (
                  <tr key={device.deviceId} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{device.businessName}</td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-mono text-xs text-amber-600 dark:text-amber-500">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[14rem]" title={device.deviceId}>
                          {device.deviceId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(device.deviceId, true)}
                          disabled={approveDeviceMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 px-2.5 py-1.5 text-xs font-bold transition-colors border border-green-500/20 dark:border-green-550/20 disabled:opacity-50"
                          title="Approve Device"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Approve</span>
                        </button>
                        <button
                          onClick={() => handleApprove(device.deviceId, false)}
                          disabled={approveDeviceMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-1.5 text-xs font-bold transition-colors border border-red-500/20 dark:border-red-550/20 disabled:opacity-50"
                          title="Reject Device"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HardwareApproval;
