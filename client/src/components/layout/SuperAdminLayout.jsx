import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Moon, Sun, Shield, Wifi, WifiOff, Download, Bell, Search, ChevronDown, UserPlus, Cpu, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export const SuperAdminLayout = ({ children }) => {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUiStore();
  const logout = useAuthStore((state) => state.logout);
  const isOnline = useNetworkStatus();
  const { isInstallable, promptInstall } = usePwaInstall();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const isDashboardActive = location.pathname === '/superadmin' || location.pathname === '/';
  const isOnboardActive = location.pathname === '/superadmin/tenants/new';
  const isHardwareActive = location.pathname === '/superadmin/hardware';
  const isDiagnosticsActive = location.pathname === '/superadmin/diagnostics';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[var(--card)] border-r border-[var(--border)] text-foreground transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-24 items-center justify-between border-b border-[var(--border)] px-6 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-[var(--accent)] shrink-0" />
            <span className="text-lg font-extrabold tracking-tight text-foreground uppercase">
              Elite SaaS Admin
            </span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-[var(--border)]"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar space-y-6">
          <div>
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Core Engine
            </p>
            <nav className="space-y-1">
              <Link
                to="/superadmin"
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all shadow-sm ${
                  isDashboardActive 
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white' 
                    : 'text-slate-650 hover:bg-slate-100 hover:text-foreground'
                }`}
              >
                <LayoutDashboard className={`h-5 w-5 shrink-0 ${isDashboardActive ? 'text-white' : 'text-slate-455'}`} />
                <span>Super Dashboard</span>
              </Link>
              <Link
                to="/superadmin/tenants/new"
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                  isOnboardActive 
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-sm' 
                    : 'text-slate-650 hover:bg-slate-100 hover:text-foreground'
                }`}
              >
                <UserPlus className={`h-5 w-5 shrink-0 ${isOnboardActive ? 'text-white' : 'text-slate-455'}`} />
                <span>Onboard Tenant</span>
              </Link>
              <Link
                to="/superadmin/hardware"
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                  isHardwareActive 
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-sm' 
                    : 'text-slate-650 hover:bg-slate-100 hover:text-foreground'
                }`}
              >
                <Cpu className={`h-5 w-5 shrink-0 ${isHardwareActive ? 'text-white' : 'text-slate-455'}`} />
                <span>Hardware approvals</span>
              </Link>
              <Link
                to="/superadmin/diagnostics"
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                  isDiagnosticsActive 
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-sm' 
                    : 'text-slate-650 hover:bg-slate-100 hover:text-foreground'
                }`}
              >
                <Activity className={`h-5 w-5 shrink-0 ${isDiagnosticsActive ? 'text-white' : 'text-slate-455'}`} />
                <span>Sync Diagnostics</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-6 bg-slate-50">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] hover:border-red-500/20 bg-[var(--card)] px-4 py-2.5 text-sm font-bold hover:bg-red-500/10 text-slate-700 hover:text-red-600 transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className={`flex flex-1 flex-col overflow-y-auto transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
      }`}>
        
        <header className="sticky top-0 z-35 flex h-24 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6 shadow-sm shrink-0 text-[var(--foreground)]">
          
          <div className="flex items-center gap-4">
            <button
               onClick={toggleSidebar}
               className="rounded-lg border border-[var(--border)] p-2 text-muted-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden md:block max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input 
                type="text"
                disabled
                placeholder="Search metrics, tenants..."
                className="w-64 rounded-full border border-[var(--border)] bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed opacity-85"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border transition-all ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
            }`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5 shrink-0" /> : <WifiOff className="h-3.5 w-3.5 shrink-0" />}
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {isInstallable && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--foreground)] text-[var(--card)] hover:opacity-90 font-bold text-xs transition-opacity shrink-0 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
            )}

            <button 
              disabled
              className="relative rounded-lg border border-[var(--border)] p-2 text-muted-foreground hover:bg-muted transition-colors cursor-not-allowed opacity-60"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg border border-[var(--border)] p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <div className="h-8 w-px bg-[var(--border)] hidden sm:block" />

            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 text-left focus:outline-none"
              >
                <div className="hidden text-right md:block">
                  <p className="text-xs font-extrabold text-slate-700">SaaS Administrator</p>
                  <p className="text-[10px] text-slate-500 font-semibold">operator@saas.com</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center font-bold text-white shadow-md border-2 border-white hover:opacity-90 transition-opacity">
                    SA
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 hidden sm:block shrink-0" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                  <div className="absolute right-0 mt-3.5 z-20 w-48 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg animate-slide-in">
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-semibold cursor-not-allowed opacity-60 text-foreground">
                      <UserPlus className="h-4 w-4" />
                      <span>My Profile</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-semibold cursor-not-allowed opacity-60 text-foreground">
                      <Cpu className="h-4 w-4" />
                      <span>Account Settings</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-semibold cursor-not-allowed opacity-60 text-foreground">
                      <Cpu className="h-4 w-4" />
                      <span>Support Center</span>
                    </div>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-red-500/10 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
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

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
