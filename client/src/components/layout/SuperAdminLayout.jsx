import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, LogOut, Menu, Moon, Sun, Shield, Wifi, WifiOff, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export const SuperAdminLayout = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const logout = useAuthStore((state) => state.logout);
  const isOnline = useNetworkStatus();
  const { isInstallable, promptInstall } = usePwaInstall();
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-border px-6">
          <Shield className="h-8 w-8 text-amber-600 dark:text-amber-500" />
          <span className="text-xl font-extrabold tracking-tight">SuperAdmin Panel</span>
        </div>

        <nav className="flex-1 space-y-2 p-6">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-foreground transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </a>
        </nav>

        <div className="border-t border-border p-6">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-semibold hover:bg-muted transition-colors text-red-500 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6">
          <button
            onClick={toggleSidebar}
            className="rounded-lg border border-border p-2 hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Unified POS Platform Engine</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-colors ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
            }`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {isInstallable && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shrink-0 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold">Administrator</p>
                <p className="text-xs text-muted-foreground">operator@saas.com</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-600 dark:bg-amber-500 flex items-center justify-center font-bold text-white shadow-md">
                SA
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
export default SuperAdminLayout;
