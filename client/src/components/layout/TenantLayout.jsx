import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useUiStore } from '../../store/useUiStore';

export const TenantLayout = ({ children }) => {
  const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        <TopNav />
        <main className="flex-1 overflow-hidden flex flex-col p-[3px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TenantLayout;
