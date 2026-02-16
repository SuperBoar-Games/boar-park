// React Query hooks for fetching roles and permissions

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { queryKeys } from "../../lib/queryKeys";
import type { Permission, SystemRole, UserWithRole, ImpersonationState } from "./types";

// =====================================================
// PERMISSION QUERIES
// =====================================================

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.roles.permissions.all,
    queryFn: async () => {
      const response = await apiClient.get<{ data: Permission[] }>("/api/admin/permissions");
      return response.data;
    }
  });
}

export function usePermission(id: number | null) {
  return useQuery({
    queryKey: queryKeys.roles.permissions.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Permission }>(`/api/admin/permissions/${id}`);
      return response.data;
    },
    enabled: !!id
  });
}

// =====================================================
// ROLE QUERIES
// =====================================================

export function useRoles(includePermissions = false) {
  return useQuery({
    queryKey: includePermissions
      ? queryKeys.roles.rolesWithPermissions
      : queryKeys.roles.roles.all,
    queryFn: async () => {
      const url = includePermissions
        ? "/api/admin/system-roles?includePermissions=true"
        : "/api/admin/system-roles";
      const response = await apiClient.get<{ data: SystemRole[] }>(url);
      return response.data;
    }
  });
}

export function useRole(id: number | null, includePermissions = false) {
  return useQuery({
    queryKey: queryKeys.roles.roles.detail(id!),
    queryFn: async () => {
      const url = includePermissions
        ? `/api/admin/system-roles/${id}?includePermissions=true`
        : `/api/admin/system-roles/${id}`;
      const response = await apiClient.get<{ data: SystemRole }>(url);
      return response.data;
    },
    enabled: !!id
  });
}

// =====================================================
// USER ROLE QUERIES
// =====================================================

export function useUsersWithRoles() {
  return useQuery({
    queryKey: queryKeys.roles.usersWithRoles,
    queryFn: async () => {
      const response = await apiClient.get<{ data: UserWithRole[] }>("/api/admin/users-with-roles");
      return response.data;
    }
  });
}

export function useUserPermissions(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.roles.userPermissions(userId!),
    queryFn: async () => {
      const response = await apiClient.get<{ data: string[] }>(`/api/admin/users/${userId}/permissions`);
      return response.data;
    },
    enabled: !!userId
  });
}

// =====================================================
// IMPERSONATION QUERIES
// =====================================================

export function useImpersonationState(enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles.impersonationState,
    queryFn: async () => {
      const response = await apiClient.get<{ data: ImpersonationState }>("/api/admin/impersonate/state");
      return response.data;
    },
    enabled, // Only fetch if enabled
    // Refetch every 30 seconds to keep state fresh
    refetchInterval: enabled ? 30000 : false
  });
}
