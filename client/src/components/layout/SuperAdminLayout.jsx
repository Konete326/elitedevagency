import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, LogOut, Menu, Moon, Sun, Shield, Wifi, WifiOff, Download, Bell, Search, ChevronDown, User, Settings, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export const SuperAdminLayout = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const logout = useAuthStore((state) => state.logout);
  const isOnline = useNetworkStatus();
  const { isInstallable, promptInstall } = usePwaInstall();
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-foreground transition-colors duration-300">
      
      {/* SIDEBAR COMPONENT (TailAdmin dark style) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1C2434] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-[#2E3A4E] px-6 gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-amber-500 shrink-0" />
            <span className="text-lg font-extrabold tracking-tight text-white uppercase">
              Elite SaaS Admin
            </span>
          </div>
          {/* Close button for mobile menu */}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 hover:bg-[#333A48] rounded-md transition-colors"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Sidebar Menu Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar space-y-6">
          <div>
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Core Engine
            </p>
            <nav className="space-y-1">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg bg-[#333A48] text-white px-4 py-3 text-sm font-bold transition-all shadow-sm"
              >
                <LayoutDashboard className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Super Dashboard</span>
              </a>
            </nav>
          </div>
          
          <div>
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Diagnostics
            </p>
            <nav className="space-y-1 text-slate-400">
              <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-xs font-semibold select-none cursor-default">
                <Wifi className="h-4 w-4 shrink-0" />
                <span>Node Connection Logs</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-[#2E3A4E] p-6 bg-[#181F2C]">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg border border-[#333A48] hover:border-red-500/20 bg-transparent px-4 py-2.5 text-sm font-bold hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        
        {/* Sleek Top Header (TailAdmin style) */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-white dark:bg-zinc-900 px-6 shadow-sm">
          
          {/* Left Side Header (Hamburger menu or title) */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mock Search Input */}
            <div className="relative hidden md:block max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input 
                type="text"
                disabled
                placeholder="Search metrics, tenants..."
                className="w-64 rounded-full border border-border bg-slate-50 dark:bg-zinc-800/50 pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Right Side Header Controls */}
          <div className="flex items-center gap-4">
            
            {/* Online Status Pill */}
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border transition-all ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
            }`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5 shrink-0" /> : <WifiOff className="h-3.5 w-3.5 shrink-0" />}
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Install PWA Button */}
            {isInstallable && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shrink-0 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
            )}

            {/* Notification Bell (Mock) */}
            <button 
              disabled
              className="relative rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted transition-colors cursor-not-allowed opacity-60"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Dark Mode Toggler */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 text-left focus:outline-none"
              >
                <div className="hidden text-right md:block">
                  <p className="text-xs font-extrabold text-foreground">SaaS Administrator</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">operator@saas.com</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-amber-600 dark:bg-amber-500 flex items-center justify-center font-bold text-white shadow-md border-2 border-white dark:border-zinc-800 hover:opacity-90 transition-opacity">
                    SA
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                  <div className="absolute right-0 mt-3.5 z-20 w-48 rounded-lg border border-border bg-card p-2 shadow-lg animate-slide-in">
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-semibold cursor-not-allowed opacity-60 text-foreground">
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-semibold cursor-not-allowed opacity-60 text-foreground">
                      <Settings className="h-4 w-4" />
                      <span>Account Settings</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-semibold cursor-not-allowed opacity-60 text-foreground">
                      <HelpCircle className="h-4 w-4" />
                      <span>Support Center</span>
                    </div>
                    <div className="h-px bg-border my-1" />
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

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
