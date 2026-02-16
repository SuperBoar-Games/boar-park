// React Query hooks for admin data fetching

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.admin.users.all,
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        '/api/admin/users'
      );
      return response.data;
    },
  });
}

export function useRolesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.roles(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        '/api/admin/roles'
      );
      return response.data;
    },
  });
}

export function useGamesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.games(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        '/api/admin/games'
      );
      return response.data;
    },
  });
}
