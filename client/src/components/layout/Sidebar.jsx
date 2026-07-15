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
  const [expandedGroups, setExpandedGroups] = useState({
    billing: true,
    inventory: true,
    gym: true,
    admin: false
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

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
      { path: '/dashboard', label: 'Business Dashboard', icon: LayoutDashboard }
    ];

    const isOwnerOrManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

    const billingChildren = [
      { path: '/pos', label: 'POS Terminal', icon: Store }
    ];
    if (isOwnerOrManager) {
      billingChildren.push({ path: '/returns', label: 'Returns Manager', icon: RotateCcw });
    }
    billingChildren.push({ path: '/orders', label: 'Order History', icon: History });
    billingChildren.push({ path: '/galla', label: 'Cash Drawer', icon: Coins });
    billingChildren.push({ path: '/khata', label: 'Credit Ledger', icon: Wallet });

    tenantLinks.push({
      key: 'billing',
      label: 'Sales & Billing',
      icon: Store,
      isGroup: true,
      children: billingChildren
    });

    if (isOwnerOrManager) {
      tenantLinks.push({
        key: 'inventory',
        label: 'Inventory Hub',
        icon: Package,
        isGroup: true,
        children: [
          { path: '/inventory', label: 'Products List', icon: Package },
          { path: '/inventory/categories', label: 'Categories List', icon: Layers },
          { path: '/deals', label: 'Deals Catalog', icon: Tag }
        ]
      });
    }

    if (isOwnerOrManager && niche === 'GYM') {
      const gymChildren = [
        { path: '/plans', label: 'Membership Plans', icon: Award },
        { path: '/members', label: 'Members List', icon: UserCheck },
        { path: '/payments', label: '12-Mo Fees', icon: CircleDollarSign }
      ];
      if (features.includes('Instructor Payroll')) {
        gymChildren.push({ path: '/trainers', label: 'Trainer Payroll', icon: Users });
      }
      if (features.includes('BMI Tracker')) {
        gymChildren.push({ path: '/measurements', label: 'BMI Metrics', icon: Activity });
      }

      tenantLinks.push({
        key: 'gym',
        label: 'Gym Management',
        icon: Award,
        isGroup: true,
        children: gymChildren
      });
    }

    if (isOwnerOrManager) {
      const adminChildren = [
        { path: '/employees', label: 'Employees List', icon: Users },
        { path: '/reports', label: 'Reports Hub', icon: TrendingUp }
      ];
      if (niche === 'RESTAURANT' && features.includes('Table Management')) {
        adminChildren.push({ path: '/floor-map', label: 'Table Layout', icon: LayoutGrid });
      }
      adminChildren.push({ path: '/settings', label: 'System Settings', icon: Settings });

      tenantLinks.push({
        key: 'admin',
        label: 'Administration',
        icon: Settings,
        isGroup: true,
        children: adminChildren
      });
    }

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
      className={`fixed inset-y-0 left-0 z-55 flex flex-col bg-[var(--primary-accent)] border-r border-white/10 text-white transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
    >
      <div className={`relative flex h-16 items-center border-b border-white/10 shrink-0 ${
        sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-5 gap-3'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          {isSuperAdmin ? (
            <Shield className="h-6 w-6 text-white shrink-0" />
          ) : (
            <Store className="h-6 w-6 text-white shrink-0" />
          )}
          {!sidebarCollapsed && (
            <span className="text-sm font-black tracking-tight text-white uppercase truncate">
              {isSuperAdmin ? 'Elite Admin' : (user?.businessName || 'Elite POS')}
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebarCollapse}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-60 hidden lg:flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/15 backdrop-blur-md shadow-sm hover:bg-white/25 text-white cursor-pointer"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-white" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white" />
          )}
        </button>
        <button
          onClick={toggleSidebar}
          className="lg:hidden absolute right-3 p-1.5 hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className={`flex-1 py-5 px-3 space-y-4 ${!sidebarCollapsed ? 'overflow-y-auto scrollbar-thin' : 'overflow-hidden'}`}>
        <nav className="space-y-1">
          {links.map((link, index) => {
            if (link.isGroup) {
              if (sidebarCollapsed) {
                return link.children.map((child) => {
                  const isChildActive = child.path === '/inventory' 
                    ? (location.pathname === '/inventory' || (location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/categories')))
                    : child.path === '/employees'
                    ? location.pathname.startsWith('/employees')
                    : location.pathname === child.path;
                  const ChildIcon = child.icon;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
                        isChildActive
                          ? 'bg-white/20 text-white border-l-2 border-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${isChildActive ? 'text-white' : 'text-white/60'}`} />
                    </Link>
                  );
                });
              }

              const hasActiveChild = link.children.some(child => {
                if (child.path === '/inventory') {
                  return location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/categories');
                }
                if (child.path === '/employees') {
                  return location.pathname.startsWith('/employees');
                }
                return location.pathname === child.path;
              });

              const isExpanded = expandedGroups[link.key];

              return (
                <div key={`group-${index}`} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(link.key)}
                    className="flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={`h-4.5 w-4.5 shrink-0 ${hasActiveChild ? 'text-white' : 'text-white/60'}`} />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="pl-4 space-y-1 ml-5 border-l border-white/10">
                      {link.children.map((child) => {
                        const isChildActive = child.path === '/inventory'
                          ? (location.pathname === '/inventory' || (location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/categories')))
                          : child.path === '/employees'
                          ? location.pathname.startsWith('/employees')
                          : location.pathname === child.path;
                        const ChildIcon = child.icon;

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                              isChildActive
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <ChildIcon className={`h-4 w-4 shrink-0 ${isChildActive ? 'text-white' : 'text-white/75'}`} />
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
                className={`flex items-center gap-3 rounded-lg text-xs font-bold transition-all ${
                  sidebarCollapsed ? 'px-2 py-1.5 justify-center' : 'px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-white/20 text-white border-l-2 border-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`${sidebarCollapsed ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'} shrink-0 ${isActive ? 'text-white' : 'text-white/60'}`} />
                {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4 bg-black/10">
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/15 hover:border-white/30 bg-white/10 py-2.5 text-xs font-extrabold hover:bg-white/20 text-white transition-all shadow-sm cursor-pointer ${
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
