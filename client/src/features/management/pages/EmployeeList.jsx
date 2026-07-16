import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { ToggleLeft, ToggleRight, Edit3, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeList = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [employees, setEmployees] = useState([]);

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

  const handleToggleActive = async (employeeId, currentStatus) => {
    if (employeeId === user?._id || employeeId === user?.id) {
      toast.error('You cannot disable your own administrator account');
      return;
    }

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
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Staff Directory</h1>
            <p className="text-xs text-muted-foreground">Manage roles, visibility scopes, and credentials for your staff</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--primary-accent)] text-white hover:opacity-95 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff</span>
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
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
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {employees.map((emp) => {
                    const isSelf = emp._id === user?._id || emp.email === user?.email;
                    return (
                      <tr key={emp._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-zinc-950 dark:text-zinc-50">{emp.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{emp.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/10">
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
                        <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/employees/edit/${emp._id}`)}
                            disabled={isSelf}
                            className={`rounded-lg p-1.5 transition-colors border border-border ${
                              isSelf 
                                ? 'opacity-40 cursor-not-allowed text-foreground/50 bg-foreground/5' 
                                : 'bg-foreground/5 hover:bg-foreground/10 text-foreground cursor-pointer'
                            }`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(emp._id, emp.isActive)}
                            disabled={isSelf}
                            className={`rounded-lg p-1 transition-colors border border-transparent hover:bg-muted inline-flex items-center ${
                              isSelf ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            {emp.isActive ? (
                              <ToggleRight className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeList;
