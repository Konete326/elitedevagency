import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_PERMISSIONS = [
  { key: 'INVENTORY', label: 'Inventory Management' },
  { key: 'POS', label: 'Point of Sale' },
  { key: 'ORDERS', label: 'Order History' },
  { key: 'CUSTOMERS', label: 'Customer Database' },
  { key: 'REPORTS', label: 'Analytics Reports' },
  { key: 'EMPLOYEES', label: 'Employee Control' }
];

export const EmployeeManagement = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CASHIER');
  const [dataVisibility, setDataVisibility] = useState('ALL');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.data);
      }
    } catch {
      toast.error('Failed to load employees');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token, fetchEmployees]);

  const handlePermissionToggle = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Name, email, and password are required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          dataVisibility,
          permissions: selectedPermissions
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Employee created successfully');
        setName('');
        setEmail('');
        setPassword('');
        setRole('CASHIER');
        setDataVisibility('ALL');
        setSelectedPermissions([]);
        fetchEmployees();
      } else {
        toast.error(data.error || 'Failed to create employee');
      }
    } catch {
      toast.error('Network error during employee creation');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (employeeId, currentStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Staff member ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchEmployees();
      } else {
        toast.error(data.error || 'Failed to update employee status');
      }
    } catch {
      toast.error('Failed to change employee status');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors mr-2 text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-lg tracking-tight">Staff & Permissions</span>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role}</p>
          <p className="text-sm font-black">{user?.name}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
            <div className="mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-accent-niche" />
              <h2 className="text-lg font-bold tracking-tight">Add Staff Account</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. john@retail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="grid gap-2 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus:outline-none h-8"
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="CASHIER">Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Data Visibility</label>
                  <select
                    value={dataVisibility}
                    onChange={(e) => setDataVisibility(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus:outline-none h-8"
                  >
                    <option value="ALL">All Stores</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Grant Permissions</label>
                <div className="grid gap-2 grid-cols-2 max-h-[140px] overflow-y-auto border border-border rounded-lg p-2 bg-muted/20">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => handlePermissionToggle(perm.key)}
                        className="rounded border-border text-primary focus:ring-primary h-3 w-3"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-2.5 text-xs transition-colors"
              >
                <span>{loading ? 'Creating...' : 'Register Employee'}</span>
              </button>
            </form>
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-3">
              <Users className="h-5 w-5 text-accent-niche" />
              <div>
                <h2 className="text-lg font-bold tracking-tight">Active Staff Directory</h2>
                <p className="text-xs text-muted-foreground font-semibold">Roles, states, and permissions</p>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              {employees.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No employee records found.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Employee</th>
                      <th className="py-3 px-4 font-bold">Role</th>
                      <th className="py-3 px-4 font-bold">Visibility</th>
                      <th className="py-3 px-4 font-bold">Permissions</th>
                      <th className="py-3 px-4 text-right font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-zinc-950 dark:text-zinc-50">{emp.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{emp.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center rounded-full bg-accent-niche/10 px-2 py-0.5 text-[10px] font-bold text-accent-niche border border-accent-niche/10">
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-muted-foreground">
                          {emp.dataVisibility}
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px] truncate font-mono text-[9px] text-muted-foreground">
                          {emp.permissions && emp.permissions.length > 0 
                            ? emp.permissions.join(', ') 
                            : 'None'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleActive(emp._id, emp.isActive)}
                            className="rounded-lg p-1 transition-colors border border-transparent hover:bg-muted inline-flex items-center"
                          >
                            {emp.isActive ? (
                              <ToggleRight className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeManagement;
