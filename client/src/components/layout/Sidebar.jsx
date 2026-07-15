import { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useLocation } from 'react-router-dom';
import { useModalStore } from '../../store/useModalStore';
import { 
  LayoutDashboard, LogOut, Menu, Shield, Cpu, Activity, Layers, Terminal, Clock, UserPlus,
  Package, Tag, RotateCcw, Users, TrendingUp, Settings, History, LayoutGrid, Award, UserCheck, 
  CircleDollarSign, Coins, Wallet, ChevronLeft, ChevronRight, Store
} from 'lucide-react';

export const Sidebar = () => {
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapse } = useUiStore();
  const { user, logout } = useAuthStore();
  const { openModal } = useModalStore();
  const location = useLocation();
  const [inventoryExpanded, setInventoryExpanded] = useState(true);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const features = user?.features || [];
  const niche = user?.niche?.toUpperCase();

  const getLinks = () => {
    if (isSuperAdmin) {
      return [
        { path: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/superadmin/tenants/new', label: 'Add Tenant', icon: UserPlus },
        { path: '/superadmin/hardware', label: 'Device Approvals', icon: Cpu },
        { path: '/superadmin/diagnostics', label: 'Diagnostics', icon: Activity },
        { path: '/superadmin/pricing-tiers', label: 'Pricing', icon: Layers },
        { path: '/superadmin/logs', label: 'System Logs', icon: Terminal },
        { path: '/superadmin/billing', label: 'Billing Tracker', icon: Clock },
      ];
    }

    const tenantLinks = [
      { path: '/dashboard', label: 'Business Dashboard', icon: LayoutDashboard },
      { path: '/', label: 'POS Terminal', icon: Store }
    ];

    const isOwnerOrManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

    if (isOwnerOrManager) {
      tenantLinks.push({
        label: 'Inventory',
        icon: Package,
        isGroup: true,
        children: [
          { path: '/inventory', label: 'Products List', icon: Package },
          { path: '/inventory/categories', label: 'Categories List', icon: Layers },
          { path: '/deals', label: 'Deals Catalog', icon: Tag }
        ]
      });

      if (niche === 'GYM') {
        tenantLinks.push({ path: '/plans', label: 'Membership Plans', icon: Award });
        tenantLinks.push({ path: '/members', label: 'Members List', icon: UserCheck });
        tenantLinks.push({ path: '/payments', label: '12-Mo Fees', icon: CircleDollarSign });
        if (features.includes('Instructor Payroll')) {
          tenantLinks.push({ path: '/trainers', label: 'Trainer Payroll', icon: Users });
        }
        if (features.includes('BMI Tracker')) {
          tenantLinks.push({ path: '/measurements', label: 'BMI Metrics', icon: Activity });
        }
      }

      if (niche === 'RESTAURANT' && features.includes('Table Management')) {
        tenantLinks.push({ path: '/floor-map', label: 'Table Layout', icon: LayoutGrid });
      }

      tenantLinks.push({ path: '/returns', label: 'Returns Manager', icon: RotateCcw });
      tenantLinks.push({ path: '/employees', label: 'Employees List', icon: Users });
      tenantLinks.push({ path: '/reports', label: 'Reports Hub', icon: TrendingUp });
      tenantLinks.push({ path: '/settings', label: 'System Settings', icon: Settings });
    }

    tenantLinks.push({ path: '/orders', label: 'Order History', icon: History });
    tenantLinks.push({ path: '/galla', label: 'Cash Drawer', icon: Coins });
    tenantLinks.push({ path: '/khata', label: 'Credit Ledger', icon: Wallet });

    return tenantLinks;
  };

  const links = getLinks();

  const handleSignOut = () => {
    openModal({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to end your current session?',
      type: 'danger',
      confirmText: 'Sign Out',
      onConfirm: logout
    });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-55 flex flex-col bg-white dark:bg-zinc-800 border-r border-border dark:border-zinc-750 text-foreground dark:text-zinc-100 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
    >
      <div className="flex h-16 items-center justify-between border-b border-border dark:border-zinc-750 px-5 gap-3 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {isSuperAdmin ? (
            <Shield className="h-6 w-6 text-[var(--primary-accent)] shrink-0" />
          ) : (
            <Store className="h-6 w-6 text-[var(--primary-accent)] shrink-0" />
          )}
          {!sidebarCollapsed && (
            <span className="text-sm font-black tracking-tight text-foreground dark:text-white uppercase truncate">
              {isSuperAdmin ? 'Elite Admin' : (user?.businessName || 'Elite POS')}
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-1 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md border border-transparent hover:border-border dark:hover:border-zinc-700 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4.5 w-4.5 text-foreground dark:text-white" />
          ) : (
            <ChevronLeft className="h-4.5 w-4.5 text-foreground dark:text-white" />
          )}
        </button>
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-md transition-colors border border-transparent hover:border-border dark:hover:border-zinc-700"
        >
          <Menu className="h-5 w-5 text-foreground dark:text-white" />
        </button>
      </div>

      <div className={`flex-1 py-5 px-3 space-y-4 ${!sidebarCollapsed ? 'overflow-y-auto scrollbar-thin' : 'overflow-hidden'}`}>
        <nav className="space-y-1">
          {links.map((link, index) => {
            if (link.isGroup) {
              if (sidebarCollapsed) {
                return link.children.map((child) => {
                  const isChildActive = location.pathname === child.path || (child.path === '/inventory' && location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/categories'));
                  const ChildIcon = child.icon;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all ${
                        isChildActive
                          ? 'bg-[var(--primary-accent)]/10 text-[var(--primary-accent)] border-l-2 border-[var(--primary-accent)] dark:bg-white/10 dark:text-white dark:border-l-2 dark:border-[var(--primary-accent)]'
                          : 'text-slate-650 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-750/30 hover:text-foreground dark:hover:text-white'
                      }`}
                    >
                      <ChildIcon className={`h-4.5 w-4.5 shrink-0 ${isChildActive ? 'text-[var(--primary-accent)] dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
                    </Link>
                  );
                });
              }

              const hasActiveChild = link.children.some(child => {
                if (child.path === '/inventory') {
                  return location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/categories');
                }
                return location.pathname.startsWith(child.path);
              });

              return (
                <div key={`group-${index}`} className="space-y-1">
                  <button
                    onClick={() => setInventoryExpanded(!inventoryExpanded)}
                    className="flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all text-slate-650 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-750/30 hover:text-foreground dark:hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={`h-4.5 w-4.5 shrink-0 ${hasActiveChild ? 'text-[var(--primary-accent)] dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${inventoryExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {inventoryExpanded && (
                    <div className="pl-4 space-y-1 ml-5 border-l border-slate-200 dark:border-zinc-700">
                      {link.children.map((child) => {
                        const isChildActive = child.path === '/inventory'
                          ? (location.pathname === '/inventory' || (location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/categories')))
                          : location.pathname.startsWith(child.path);
                        const ChildIcon = child.icon;

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                              isChildActive
                                ? 'bg-[var(--primary-accent)]/10 text-[var(--primary-accent)] dark:bg-white/10 dark:text-white'
                                : 'text-slate-550 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-750/30 hover:text-foreground dark:hover:text-white'
                            }`}
                          >
                            <ChildIcon className={`h-4 w-4 shrink-0 ${isChildActive ? 'text-[var(--primary-accent)] dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--primary-accent)]/10 text-[var(--primary-accent)] border-l-2 border-[var(--primary-accent)] dark:bg-white/10 dark:text-white dark:border-l-2 dark:border-[var(--primary-accent)]'
                    : 'text-slate-650 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-750/30 hover:text-foreground dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[var(--primary-accent)] dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`} />
                {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border dark:border-zinc-750 p-4 bg-slate-50 dark:bg-zinc-900/40">
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center justify-center gap-2.5 rounded-lg border border-border dark:border-zinc-700 hover:border-red-500/20 dark:hover:border-red-500/30 bg-white dark:bg-zinc-800 py-2.5 text-xs font-extrabold hover:bg-red-500/10 dark:hover:bg-red-950/20 text-slate-700 dark:text-zinc-300 hover:text-red-650 dark:hover:text-red-400 transition-all shadow-sm cursor-pointer ${
            sidebarCollapsed ? 'px-0' : 'px-4'
          }`}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
