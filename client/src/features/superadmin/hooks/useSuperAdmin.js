import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';

const apiURL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

export const usePendingDevices = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['pending-devices'],
    queryFn: async () => {
      const response = await fetch(`${apiURL}/superadmin/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch pending devices');
      }
      return data.data;
    },
    enabled: !!token
  });
};

export const useApproveDevice = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId, approve }) => {
      const response = await fetch(`${apiURL}/superadmin/devices/${deviceId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approve })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Operation failed');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-devices'] });
    }
  });
};

export const useOnboardTenant = () => {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async (payload) => {
      const response = await fetch(`${apiURL}/superadmin/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Onboarding failed');
      }
      return data;
    }
  });
};

export const useTenants = (page = 1, limit = 5) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['tenants', page, limit],
    queryFn: async () => {
      const response = await fetch(`${apiURL}/superadmin/tenants?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch tenants');
      }
      return data;
    },
    enabled: !!token
  });
};

export const useToggleTenantLock = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId) => {
      const response = await fetch(`${apiURL}/superadmin/tenants/${tenantId}/toggle-lock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Toggle lock operation failed');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};

export const useToggleMobileAccess = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId) => {
      const response = await fetch(`${apiURL}/superadmin/tenants/${tenantId}/toggle-mobile-access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Toggle mobile access operation failed');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};

export const useUpdateTenantFeatures = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, features }) => {
      const response = await fetch(`${apiURL}/superadmin/tenants/${tenantId}/features`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ features })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update tenant features');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};

export const useDiagnostics = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['diagnostics'],
    queryFn: async () => {
      const response = await fetch(`${apiURL}/superadmin/diagnostics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch diagnostics');
      }
      return data.data;
    },
    enabled: !!token,
    refetchInterval: 15000
  });
};

export const useToggleTenantSuspension = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, isSuspended, suspensionTitle, suspensionDescription }) => {
      const response = await fetch(`${apiURL}/superadmin/tenants/${tenantId}/suspension`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isSuspended, suspensionTitle, suspensionDescription })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update tenant suspension');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};
