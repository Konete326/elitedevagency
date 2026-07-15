import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { useModalStore } from '../../store/useModalStore';
import { 
  Menu, Sun, Moon, Search, ChevronDown, UserPlus, Cpu, LogOut, Wifi, WifiOff, Download, Bell 
} from 'lucide-react';

export const TopNav = () => {
  const { toggleSidebar } = useUiStore();
  const { user, logout } = useAuthStore();
  const isOnline = useNetworkStatus();
  const { isInstallable, promptInstall } = usePwaInstall();
  const { openModal } = useModalStore();
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSignOut = () => {
    setProfileDropdownOpen(false);
    openModal({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to end your current session?',
      type: 'danger',
      confirmText: 'Sign Out',
      onConfirm: logout
    });
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const businessName = isSuperAdmin ? 'Elite Super Admin' : (user?.businessName || 'Elite POS');

  return (
    <header className="sticky top-0 z-35 grid grid-cols-12 h-16 items-center border-b border-border dark:border-zinc-750 bg-white dark:bg-zinc-800 px-6 shadow-xs shrink-0 text-foreground dark:text-white gap-0">
      <div className="col-span-3 flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-lg border border-border dark:border-zinc-700 p-2 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-700 cursor-pointer"
        >
          <Menu className="h-5 w-5 text-slate-650 dark:text-zinc-300" />
        </button>
        <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-zinc-100 lg:block hidden truncate">
          {businessName}
        </span>
      </div>

      <div className="col-span-4 flex items-center justify-center px-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input 
            type="text"
            disabled
            placeholder="Search terminal..."
            className="w-full rounded-full border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40 pl-9 pr-4 py-1.5 text-xs font-semibold focus:outline-none cursor-not-allowed opacity-85 text-foreground dark:text-zinc-200"
          />
        </div>
      </div>

      <div className="col-span-5 flex items-center justify-end gap-3 sm:gap-4">
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border transition-all ${
          isOnline 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
        }`}>
          {isOnline ? <Wifi className="h-3 w-3 shrink-0" /> : <WifiOff className="h-3 w-3 shrink-0" />}
          <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          {!isOnline && <span className="sm:hidden">OFF</span>}
        </div>

        {isInstallable && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-border dark:border-zinc-700 bg-slate-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 font-bold text-[9px] transition-opacity shrink-0 shadow-xs cursor-pointer"
          >
            <Download className="h-2.5 w-2.5" />
            <span>Install</span>
          </button>
        )}

        <button 
          disabled
          className="relative rounded-lg border border-border dark:border-zinc-700 p-1.5 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-705 transition-colors cursor-not-allowed opacity-60"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-lg border border-border dark:border-zinc-700 p-1.5 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="h-4 w-4 text-zinc-350" /> : <Moon className="h-4 w-4 text-slate-650" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] flex items-center justify-center text-xs font-bold text-white shadow-xs border-2 border-white dark:border-zinc-800 hover:opacity-90 transition-opacity font-sans">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-800" />
            </div>
            <div className="hidden sm:flex flex-col min-w-0 leading-tight">
              <span className="text-[10px] sm:text-xs font-bold truncate max-w-[100px] text-foreground dark:text-white">{user?.name || 'User'}</span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[130px] font-medium">{user?.email || ''}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400 hidden sm:block shrink-0" />
          </button>

          {profileDropdownOpen && (
            <>
              <div 
                onClick={() => setProfileDropdownOpen(false)}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 mt-3.5 z-20 w-48 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-lg animate-slide-in">
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted dark:hover:bg-zinc-700 text-sm font-semibold cursor-not-allowed opacity-60 text-foreground dark:text-zinc-200">
                  <UserPlus className="h-4 w-4" />
                  <span>My Profile</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted dark:hover:bg-zinc-700 text-sm font-semibold cursor-not-allowed opacity-60 text-foreground dark:text-zinc-200">
                  <Cpu className="h-4 w-4" />
                  <span>Account Settings</span>
                </div>
                <div className="h-px bg-border dark:bg-zinc-700 my-1" />
                 <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-sm font-bold transition-colors cursor-pointer text-left text-foreground dark:text-zinc-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
