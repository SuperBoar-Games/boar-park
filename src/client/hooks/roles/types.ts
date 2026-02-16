// Frontend types for roles and permissions

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface SystemRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

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

export interface ImpersonationState {
  is_impersonating: boolean;
  original_role_id: number | null;
  impersonated_role_id: number | null;
  impersonated_role_name: string | null;
}
