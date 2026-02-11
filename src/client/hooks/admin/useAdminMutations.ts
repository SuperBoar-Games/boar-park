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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useApproveUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.post(`/api/admin/users/${userId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useDisableUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.post(`/api/admin/users/${userId}/disable`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
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
