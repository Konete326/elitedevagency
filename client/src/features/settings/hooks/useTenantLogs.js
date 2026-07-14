import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';

const apiURL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

export const useTenantLogs = (filters) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['tenant-logs', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.set('type', filters.type);
      if (filters.page) queryParams.set('page', filters.page);
      if (filters.limit) queryParams.set('limit', filters.limit);

      const response = await fetch(`${apiURL}/tenant/logs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch tenant logs');
      }
      return data;
    },
    enabled: !!token
  });
};
