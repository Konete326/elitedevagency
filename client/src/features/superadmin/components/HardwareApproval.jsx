import { usePendingDevices, useApproveDevice } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { Check, X, ShieldAlert, Cpu, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminTable } from '../../../components/ui/AdminTable';
import { useModalStore } from '../../../store/useModalStore';

export const HardwareApproval = () => {
  const { data: devices = [], isLoading } = usePendingDevices();
  const approveDeviceMutation = useApproveDevice();
  const { openModal } = useModalStore();

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

  const renderRow = (device) => (
    <tr key={device.deviceId} className="hover:bg-muted/40 transition-colors">
      <td className="py-2 px-4 font-bold text-foreground dark:text-zinc-200">{device.businessName}</td>
      <td className="py-2 px-4">
        <div className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-500">
          <ShieldAlert className="h-3 w-3 text-amber-555 shrink-0" />
          <span className="truncate max-w-[12rem]" title={device.deviceId}>
            {device.deviceId}
          </span>
        </div>
      </td>
      <td className="py-2 px-4 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={() => handleApprove(device.deviceId, true)}
            disabled={approveDeviceMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 text-[10px] font-bold transition-colors border border-green-500/20 dark:border-green-550/20 disabled:opacity-50"
            title="Approve Device"
          >
            <Check className="h-3 w-3" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => {
              openModal({
                title: 'Reject Terminal Fingerprint',
                message: 'Are you sure you want to reject this hardware device? It will not be allowed to authenticate.',
                type: 'danger',
                confirmText: 'Reject Device',
                onConfirm: () => handleApprove(device.deviceId, false)
              });
            }}
            disabled={approveDeviceMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-red-500/10 hover:bg-green-500/20 text-red-650 dark:text-red-400 px-2 py-1 text-[10px] font-bold transition-colors border border-red-500/20 dark:border-red-550/20 disabled:opacity-50"
            title="Reject Device"
          >
            <X className="h-3 w-3" />
            <span>Reject</span>
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
              Hardware Approvals
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Review and whitelist terminal hardware identifiers attempting system syncs
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl shadow-lg">
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading pending devices...</p>
        </div>
      ) : (
        <AdminTable
          title="Pending Device Queue"
          description="Verify and whitelist fingerprints for desktop client nodes"
          icon={Cpu}
          headers={['Business Name', 'Hardware Fingerprint', 'Actions']}
          data={devices}
          pageSize={7}
          renderRow={renderRow}
        />
      )}
    </div>
  );
};

export default HardwareApproval;
