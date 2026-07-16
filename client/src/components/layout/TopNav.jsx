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


  return (
    <header className="sticky top-0 z-35 grid grid-cols-12 h-16 items-center border-b border-white/10 bg-[var(--primary-accent)] px-6 shadow-xs shrink-0 text-white gap-0">
      <div className="col-span-1 flex items-center">
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-lg border border-white/10 p-2 text-white hover:bg-white/10 cursor-pointer"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="col-span-7 flex items-center justify-center px-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
          <input 
            type="text"
            disabled
            placeholder="Search terminal..."
            className="w-full rounded-full border border-white/10 bg-white/10 dark:bg-black/20 pl-9 pr-4 py-1.5 text-xs font-semibold focus:outline-none cursor-not-allowed opacity-85 text-white placeholder-white/60"
          />
        </div>
      </div>

      <div className="col-span-4 flex items-center justify-end gap-3 sm:gap-4">
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border transition-all ${
          isOnline 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' 
            : 'bg-red-500/20 border-red-500/30 text-red-200 animate-pulse'
        }`}>
          {isOnline ? <Wifi className="h-3 w-3 shrink-0" /> : <WifiOff className="h-3 w-3 shrink-0" />}
          <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          {!isOnline && <span className="sm:hidden">OFF</span>}
        </div>

        {isInstallable && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-white/15 bg-white/10 text-white hover:bg-white/20 font-bold text-[9px] transition-opacity shrink-0 shadow-xs cursor-pointer"
          >
            <Download className="h-2.5 w-2.5" />
            <span>Install</span>
          </button>
        )}

        <button 
          disabled
          className="relative rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10 transition-colors cursor-not-allowed opacity-60"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white" />
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-white" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-white/15 to-white/25 flex items-center justify-center text-xs font-bold text-white shadow-xs border-2 border-white hover:opacity-90 transition-opacity font-sans">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white transition-colors ${
                isOnline ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="hidden sm:flex flex-col min-w-0 leading-tight">
              <span className="text-[10px] sm:text-xs font-bold truncate max-w-[100px] text-white">{user?.name || 'User'}</span>
              <span className="text-[9px] sm:text-[10px] text-white/70 truncate max-w-[130px] font-medium">{user?.email || ''}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-white/70 hidden sm:block shrink-0" />
          </button>

          {profileDropdownOpen && (
            <>
              <div 
                onClick={() => setProfileDropdownOpen(false)}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 mt-3.5 z-20 w-48 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-lg animate-slide-in text-slate-800 dark:text-zinc-200">
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted dark:hover:bg-zinc-700 text-sm font-semibold cursor-not-allowed opacity-60">
                  <UserPlus className="h-4 w-4" />
                  <span>My Profile</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted dark:hover:bg-zinc-700 text-sm font-semibold cursor-not-allowed opacity-60">
                  <Cpu className="h-4 w-4" />
                  <span>Account Settings</span>
                </div>
                <div className="h-px bg-border dark:bg-zinc-700 my-1" />
                 <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-sm font-bold transition-colors cursor-pointer text-left text-foreground dark:text-zinc-250"
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
