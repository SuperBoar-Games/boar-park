// React Query mutations for admin operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { username: string; email: string; roleId: number; gameId?: number }) => {
      return apiClient.post('/api/admin/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}

export function useApproveUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.post(`/api/admin/users/${userId}/approve`, {});
    },
    onMutate: async (userId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(queryKeys.admin.users.all);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.admin.users.all, (old: any) => {
        if (!old) return old;
        return old.map((user: any) =>
          user.id === userId ? { ...user, status: 'active' } : user
        );
      });

      // Return context with snapshot
      return { previousUsers };
    },
    onError: (err, userId, context: any) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.admin.users.all, context.previousUsers);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}

export function useDisableUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.post(`/api/admin/users/${userId}/disable`, {});
    },
    onMutate: async (userId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(queryKeys.admin.users.all);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.admin.users.all, (old: any) => {
        if (!old) return old;
        return old.map((user: any) =>
          user.id === userId ? { ...user, status: 'disabled' } : user
        );
      });

      // Return context with snapshot
      return { previousUsers };
    },
    onError: (err, userId, context: any) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.admin.users.all, context.previousUsers);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}

export function useAssignRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: number; roleId: number; gameId?: number }) => {
      return apiClient.post('/api/admin/assign-role', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}

export function useRemoveRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: number; roleId: number; gameId: number | null }) => {
      return apiClient.post('/api/admin/remove-role', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    },
  });
}

export function useSendResetEmailMutation() {
  return useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.post(`/api/admin/users/${userId}/send-reset-email`, {});
    },
  });
}
