// Types for role-based permissions system

export interface Permission {
  id: number;
  name: string; // e.g., 'users:create', 'games:read'
  description: string | null;
  created_at: string;
}

export interface SystemRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: string;
}

export interface RoleWithPermissions extends SystemRole {
  permissions: Permission[];
}

export interface UserPermission {
  user_id: number;
  username: string;
  email: string;
  role_id: number | null;
  role_name: string | null;
  permission_id: number | null;
  permission_name: string | null;
}

// Request/Response types
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface AssignPermissionsRequest {
  permission_ids: number[];
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
}

// Impersonation types
export interface ImpersonationState {
  is_impersonating: boolean;
  original_role_id: number | null;
  impersonated_role_id: number | null;
  impersonated_role_name: string | null;
}

// Extended user type with role info
export interface UserWithRole {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  status: string;
  role_id: number | null;
  role_name: string | null;
  created_at: string;
  updated_at: string;
}
