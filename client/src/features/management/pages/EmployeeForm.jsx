import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const AVAILABLE_PERMISSIONS = [
  { key: 'INVENTORY', label: 'Inventory Management' },
  { key: 'POS', label: 'Point of Sale' },
  { key: 'ORDERS', label: 'Order History' },
  { key: 'CUSTOMERS', label: 'Customer Database' },
  { key: 'REPORTS', label: 'Analytics Reports' },
  { key: 'EMPLOYEES', label: 'Employee Control' }
];

export const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { token, user } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CASHIER');
  const [dataVisibility, setDataVisibility] = useState('ALL');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const emp = data.data.find(e => e._id === id);
        if (emp) {
          if (emp.email === user?.email || emp._id === user?._id) {
            toast.error('You cannot edit your own profile credentials');
            navigate('/employees');
            return;
          }
          setName(emp.name || '');
          setEmail(emp.email || '');
          setRole(emp.role || 'CASHIER');
          setDataVisibility(emp.dataVisibility || 'ALL');
          setSelectedPermissions(emp.permissions || []);
        }
      }
    } catch {
      toast.error('Failed to load employee details');
    }
  }, [id, token, user, navigate]);

  useEffect(() => {
    if (isEdit && id && user) {
      if (id === user._id) {
        toast.error('You cannot edit your own profile credentials');
        navigate('/employees');
        return;
      }
    }
    if (isEdit && token) {
      fetchEmployeeData();
    }
  }, [isEdit, id, user, token, fetchEmployeeData, navigate]);

  const handlePermissionToggle = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }
    if (!isEdit && !password) {
      toast.error('Password is required');
      return;
    }

    try {
      setLoading(true);
      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/employees/${id}`
        : `${import.meta.env.VITE_API_URL}/employees`;

      const method = isEdit ? 'PATCH' : 'POST';
      const bodyPayload = {
        name,
        email,
        role,
        dataVisibility,
        permissions: selectedPermissions,
        ...(password ? { password } : {})
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isEdit ? 'Employee updated successfully' : 'Employee created successfully');
        navigate('/employees');
      } else {
        toast.error(data.error || 'Failed to save employee');
      }
    } catch {
      toast.error('Network error during employee operation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="flex items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{isEdit ? 'Edit Staff Account' : 'Add Staff Account'}</h1>
            <p className="text-xs text-muted-foreground">{isEdit ? 'Modify access settings and visibility policies' : 'Onboard store employees and grant credentials'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. John Doe"
                  required
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
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Password {isEdit && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={isEdit ? 'New password (optional)' : 'Min 6 characters'}
                  required={!isEdit}
                />
              </div>

              <div className="grid gap-2 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus:outline-none cursor-pointer"
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
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Stores</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">Grant Permissions</label>
              <div className="grid gap-2 grid-cols-2 max-h-[120px] overflow-y-auto border border-border rounded-lg p-3 bg-muted/20">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.key)}
                      onChange={() => handlePermissionToggle(perm.key)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary-accent)] text-white hover:opacity-95 font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer"
              >
                <span>{loading ? 'Saving...' : isEdit ? 'Save Employee' : 'Register Employee'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EmployeeForm;
