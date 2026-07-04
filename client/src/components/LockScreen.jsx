import { ShieldAlert } from 'lucide-react';

export const LockScreen = ({ reason }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 select-none">
      <div className="relative w-full max-w-md p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-md shadow-2xl flex flex-col items-center text-center space-y-6 animate-fade-in">
        <div className="absolute -top-12 flex h-24 w-24 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-500 shadow-lg shadow-red-500/10">
          <ShieldAlert className="h-12 w-12 animate-pulse" />
        </div>
        
        <div className="pt-8 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">System Locked</h1>
          <p className="text-sm font-medium text-red-400">Software License Expired or Restricted</p>
        </div>

        <div className="w-full p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 text-left space-y-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reason for Lock</span>
          <p className="text-sm font-medium text-zinc-300">
            {reason || 'A remote administrative lock has been triggered on this client application.'}
          </p>
        </div>

        <div className="space-y-4 w-full">
          <div className="text-xs text-zinc-500 space-y-1">
            <p>Please contact your SaaS SuperAdmin or support team to resolve this block.</p>
            <p className="font-semibold text-zinc-400">support@unifiedpos.engine</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LockScreen;
