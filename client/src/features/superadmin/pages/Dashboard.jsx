import { useState } from 'react';
import { usePendingDevices, useApproveDevice } from '../hooks/useSuperAdmin';
import { TenantList } from '../components/TenantList';
import { TenantOnboardForm } from '../components/TenantOnboardForm';
import { toast } from 'sonner';
import { Users, AlertTriangle, Check, X, Key, Clipboard } from 'lucide-react';

export const Dashboard = () => {
  const [credentials, setCredentials] = useState(null);

  const { data: devices = [], isLoading } = usePendingDevices();
  const approveDeviceMutation = useApproveDevice();

  const handleApprove = (deviceId, approve) => {
    approveDeviceMutation.mutate({ deviceId, approve }, {
      onSuccess: () => {
        toast.success(approve ? 'Device approved successfully!' : 'Device rejected');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">SuperAdmin Engine</h1>
      </div>

      {credentials && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setCredentials(null)}
              className="rounded-lg hover:bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-start gap-4 pr-8">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-500 border border-amber-500/20">
              <Key className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg tracking-tight text-amber-800 dark:text-amber-400">Default Owner Credentials</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-500/80 font-medium">
                The Tenant Owner user account was seeded successfully. Share these temporary login details:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
                    <p className="text-sm font-bold truncate">{credentials.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Temporary Password</p>
                    <p className="text-sm font-mono font-bold tracking-wider">{credentials.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <TenantOnboardForm onSuccess={setCredentials} />

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-full">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">Device Approval Queue</h2>
            <p className="text-sm text-muted-foreground">Approve pending client device fingerprints for login</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[340px] space-y-4 pr-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading queue...</p>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-lg text-muted-foreground space-y-2">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">All device fingerprints cleared</p>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted border border-border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{device.businessName}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="truncate max-w-[180px]">{device.deviceId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(device.deviceId, true)}
                      disabled={approveDeviceMutation.isPending}
                      className="rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 p-2.5 transition-colors border border-green-500/20"
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleApprove(device.deviceId, false)}
                      disabled={approveDeviceMutation.isPending}
                      className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-2.5 transition-colors border border-red-500/20"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <TenantList />
    </div>
  );
};
export default Dashboard;
