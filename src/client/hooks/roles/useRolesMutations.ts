// React Query mutations for roles and permissions

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { queryKeys } from "../../lib/queryKeys";
import type { Permission, SystemRole } from "./types";

// =====================================================
// PERMISSION MUTATIONS
// =====================================================

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiClient.post<{ data: Permission }>("/api/admin/permissions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions.all });
    }
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; description?: string } }) => {
      const response = await apiClient.put<{ data: Permission }>(`/api/admin/permissions/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions.detail(variables.id) });
    }
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/admin/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.rolesWithPermissions });
    }
  });
}

// =====================================================
// ROLE MUTATIONS
// =====================================================

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; permission_ids?: number[] }) => {
      const response = await apiClient.post<{ data: SystemRole }>("/api/admin/system-roles", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.roles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.rolesWithPermissions });
    }
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; description?: string } }) => {
      const response = await apiClient.put<{ data: SystemRole }>(`/api/admin/system-roles/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.roles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.roles.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.rolesWithPermissions });
    }
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/admin/system-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.roles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.rolesWithPermissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.usersWithRoles });
    }
  });
}

// =====================================================
// ROLE-PERMISSION ASSIGNMENT MUTATIONS
// =====================================================

export function useAssignPermissionsToRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) => {
      const response = await apiClient.put<{ data: SystemRole }>(
        `/api/admin/system-roles/${roleId}/permissions`,
        { permission_ids: permissionIds }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.roles.detail(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.rolesWithPermissions });
    }
  });
}

export function useRemovePermissionFromRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      await apiClient.delete(`/api/admin/system-roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.roles.detail(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.rolesWithPermissions });
    }
  });
}

// =====================================================
// USER ROLE MUTATIONS
// =====================================================

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number | null }) => {
      const response = await apiClient.put(`/api/admin/users/${userId}/role`, { roleId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.usersWithRoles });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    }
  });
}

// =====================================================
// IMPERSONATION MUTATIONS
// =====================================================

export function useStartImpersonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: number) => {
      const response = await apiClient.post("/api/admin/impersonate/start", { roleId });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate impersonation state
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.impersonationState });
      // Invalidate permissions cache to fetch new role's permissions
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.permissions });
    }
  });
}

export function useStopImpersonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/api/admin/impersonate/stop", {});
      return response.data;
    },
    onSuccess: () => {
      // Invalidate impersonation state
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.impersonationState });
      // Invalidate permissions cache to restore admin permissions
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.permissions });
    }
  });
}
