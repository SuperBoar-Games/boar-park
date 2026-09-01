// Hook to get current user's permissions with helper functions

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Fetch current user's permissions from backend
 * Returns array of permission strings like ['movies:read', 'heroes:create', ...]
 */
export function usePermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.auth.permissions,
    queryFn: async () => {
      const response = await apiClient.get<{ data: string[] }>('/api/auth/me/permissions');
      return response.data;
    },
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook that returns permission checker functions
 * Usage:
 *   const { hasPermission, canCreate, canRead, canUpdate, canDelete } = usePermissionCheck();
 *   if (canCreate('heroes')) { ... }
 */
export function usePermissionCheck() {
  const { isAdmin } = useAuth();
  const { data: permissions = [], isLoading } = usePermissions();

  // Admins have all permissions
  const adminHasAll = isAdmin();

  /**
   * Check if user has a specific permission
   * @param permission - Full permission string (e.g., 'movies:read')
   */
  const hasPermission = (permission: string): boolean => {
    if (isLoading) return false;
    if (adminHasAll) return true; // Admins have all permissions
    return permissions.includes(permission);
  };

  /**
   * Check if user has any permission matching a pattern
   * @param pattern - Regex pattern or array of permission strings
   * Example: hasAnyPermission(['heroes:read', 'movies:read'])
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (isLoading) return false;
    if (adminHasAll) return true; // Admins have all permissions
    return permissionList.some(p => permissions.includes(p));
  };

  /**
   * Check create permission for a resource
   * @param resource - Resource name (e.g., 'heroes', 'movies')
   */
  const canCreate = (resource: string): boolean => {
    return hasPermission(`${resource}:create`);
  };

  /**
   * Check read permission for a resource
   * @param resource - Resource name (e.g., 'heroes', 'movies')
   */
  const canRead = (resource: string): boolean => {
    return hasPermission(`${resource}:read`);
  };

  /**
   * Check update permission for a resource
   * @param resource - Resource name (e.g., 'heroes', 'movies')
   */
  const canUpdate = (resource: string): boolean => {
    return hasPermission(`${resource}:update`);
  };

  /**
   * Check delete permission for a resource
   * @param resource - Resource name (e.g., 'heroes', 'movies')
   */
  const canDelete = (resource: string): boolean => {
    return hasPermission(`${resource}:delete`);
  };

  /**
   * Check if user has any access to a resource (any CRUD permission)
   * @param resource - Resource name (e.g., 'heroes', 'movies')
   */
  const hasAccessTo = (resource: string): boolean => {
    return hasAnyPermission([
      `${resource}:create`,
      `${resource}:read`,
      `${resource}:update`,
      `${resource}:delete`
    ]);
  };

  /**
   * Check if user has any access to talkies game
   * (checks heroes, movies, cards, tags, or parent talkies permission)
   */
  const hasTalkiesAccess = (): boolean => {
    return hasAnyPermission([
      'talkies:read', 'talkies:create', 'talkies:update', 'talkies:delete',
      'heroes:read', 'heroes:create', 'heroes:update', 'heroes:delete',
      'movies:read', 'movies:create', 'movies:update', 'movies:delete',
      'cards:read', 'cards:create', 'cards:update', 'cards:delete',
      'tags:read', 'tags:create', 'tags:update', 'tags:delete'
    ]);
  };

  /**
   * Check if user has any access to user management
   * (checks users, roles, permissions, or parent user_management permission)
   */
  const hasUserManagementAccess = (): boolean => {
    return hasAnyPermission([
      'user_management:read', 'user_management:create', 'user_management:update', 'user_management:delete',
      'users:read', 'users:create', 'users:update', 'users:delete',
      'roles:read', 'roles:create', 'roles:update', 'roles:delete',
      'permissions:read', 'permissions:create', 'permissions:update', 'permissions:delete'
    ]);
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    hasAccessTo,
    hasTalkiesAccess,
    hasUserManagementAccess,
  };
}
