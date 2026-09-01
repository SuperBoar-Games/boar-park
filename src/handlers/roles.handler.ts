// Role and Permission API handlers

import { sql } from "bun";
import { jsonResponse } from "../utils";
import {
  GET_ALL_PERMISSIONS_QUERY,
  GET_PERMISSION_BY_ID_QUERY,
  CREATE_PERMISSION_QUERY,
  UPDATE_PERMISSION_QUERY,
  DELETE_PERMISSION_QUERY,
  GET_ALL_ROLES_QUERY,
  GET_ROLE_BY_ID_QUERY,
  GET_ROLE_BY_NAME_QUERY,
  CREATE_ROLE_QUERY,
  UPDATE_ROLE_QUERY,
  DELETE_ROLE_QUERY,
  GET_ROLE_WITH_PERMISSIONS_QUERY,
  GET_ALL_ROLES_WITH_PERMISSIONS_QUERY,
  ASSIGN_PERMISSION_TO_ROLE_QUERY,
  REMOVE_PERMISSION_FROM_ROLE_QUERY,
  CLEAR_ROLE_PERMISSIONS_QUERY,
  GET_USER_PERMISSIONS_QUERY,
  CHECK_USER_PERMISSION_QUERY,
  UPDATE_USER_ROLE_QUERY,
  GET_ALL_USERS_WITH_ROLES_QUERY,
} from "../queries/roles.queries";
import type {
  Permission,
  SystemRole,
  RoleWithPermissions,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  UserWithRole,
} from "../types/roles.types";

// =====================================================
// PERMISSION HANDLERS
// =====================================================

export async function getAllPermissionsHandler(): Promise<Response> {
  try {
    const permissions = await sql.unsafe(GET_ALL_PERMISSIONS_QUERY);
    return jsonResponse({ success: true, data: permissions }, 200);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return jsonResponse({ success: false, message: "Failed to fetch permissions" }, 500);
  }
}

export async function getPermissionByIdHandler(id: string): Promise<Response> {
  try {
    const result = await sql.unsafe(GET_PERMISSION_BY_ID_QUERY, [id]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Permission not found" }, 404);
    }
    return jsonResponse({ success: true, data: result[0] }, 200);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return jsonResponse({ success: false, message: "Failed to fetch permission" }, 500);
  }
}

export async function createPermissionHandler(body: CreatePermissionRequest): Promise<Response> {
  const { name, description } = body;

  if (!name) {
    return jsonResponse({ success: false, message: "Permission name is required" }, 400);
  }

  // Validate format (resource:action)
  if (!/^[a-z_]+:[a-z_]+$/.test(name)) {
    return jsonResponse(
      { success: false, message: "Permission name must follow format 'resource:action' (e.g., 'users:create')" },
      400
    );
  }

  try {
    const result = await sql.unsafe(CREATE_PERMISSION_QUERY, [name, description || null]);
    return jsonResponse({ success: true, data: result[0] }, 201);
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint violation
      return jsonResponse({ success: false, message: "Permission with this name already exists" }, 409);
    }
    console.error("Error creating permission:", error);
    return jsonResponse({ success: false, message: "Failed to create permission" }, 500);
  }
}

export async function updatePermissionHandler(id: string, body: UpdatePermissionRequest): Promise<Response> {
  const { name, description } = body;

  if (!name && description === undefined) {
    return jsonResponse({ success: false, message: "At least one field (name or description) is required" }, 400);
  }

  if (name && !/^[a-z_]+:[a-z_]+$/.test(name)) {
    return jsonResponse(
      { success: false, message: "Permission name must follow format 'resource:action'" },
      400
    );
  }

  try {
    const result = await sql.unsafe(UPDATE_PERMISSION_QUERY, [id, name || null, description || null]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Permission not found" }, 404);
    }
    return jsonResponse({ success: true, data: result[0] }, 200);
  } catch (error: any) {
    if (error.code === "23505") {
      return jsonResponse({ success: false, message: "Permission with this name already exists" }, 409);
    }
    console.error("Error updating permission:", error);
    return jsonResponse({ success: false, message: "Failed to update permission" }, 500);
  }
}

export async function deletePermissionHandler(id: string): Promise<Response> {
  try {
    const result = await sql.unsafe(DELETE_PERMISSION_QUERY, [id]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Permission not found" }, 404);
    }
    return jsonResponse({ success: true, message: "Permission deleted successfully" }, 200);
  } catch (error) {
    console.error("Error deleting permission:", error);
    return jsonResponse({ success: false, message: "Failed to delete permission" }, 500);
  }
}

// =====================================================
// ROLE HANDLERS
// =====================================================

export async function getAllRolesHandler(includePermissions = false): Promise<Response> {
  try {
    const query = includePermissions ? GET_ALL_ROLES_WITH_PERMISSIONS_QUERY : GET_ALL_ROLES_QUERY;
    const roles = await sql.unsafe(query);
    return jsonResponse({ success: true, data: roles }, 200);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return jsonResponse({ success: false, message: "Failed to fetch roles" }, 500);
  }
}

export async function getRoleByIdHandler(id: string, includePermissions = false): Promise<Response> {
  try {
    const query = includePermissions ? GET_ROLE_WITH_PERMISSIONS_QUERY : GET_ROLE_BY_ID_QUERY;
    const result = await sql.unsafe(query, [id]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Role not found" }, 404);
    }
    return jsonResponse({ success: true, data: result[0] }, 200);
  } catch (error) {
    console.error("Error fetching role:", error);
    return jsonResponse({ success: false, message: "Failed to fetch role" }, 500);
  }
}

export async function createRoleHandler(body: CreateRoleRequest): Promise<Response> {
  const { name, description, permission_ids } = body;

  if (!name) {
    return jsonResponse({ success: false, message: "Role name is required" }, 400);
  }

  // Validate name (alphanumeric, underscore, lowercase)
  if (!/^[a-z_]{2,50}$/.test(name)) {
    return jsonResponse(
      { success: false, message: "Role name must be 2-50 lowercase letters or underscores" },
      400
    );
  }

  try {
    // Create role
    const roleResult = await sql.unsafe(CREATE_ROLE_QUERY, [name, description || null]);
    const newRole = roleResult[0];

    // Assign permissions if provided
    if (permission_ids && permission_ids.length > 0) {
      for (const permId of permission_ids) {
        await sql.unsafe(ASSIGN_PERMISSION_TO_ROLE_QUERY, [newRole.id, permId]);
      }
    }

    // Fetch role with permissions
    const finalResult = await sql.unsafe(GET_ROLE_WITH_PERMISSIONS_QUERY, [newRole.id]);
    return jsonResponse({ success: true, data: finalResult[0] }, 201);
  } catch (error: any) {
    if (error.code === "23505") {
      return jsonResponse({ success: false, message: "Role with this name already exists" }, 409);
    }
    console.error("Error creating role:", error);
    return jsonResponse({ success: false, message: "Failed to create role" }, 500);
  }
}

export async function updateRoleHandler(id: string, body: UpdateRoleRequest): Promise<Response> {
  const { name, description } = body;

  if (!name && description === undefined) {
    return jsonResponse({ success: false, message: "At least one field (name or description) is required" }, 400);
  }

  if (name && !/^[a-z_]{2,50}$/.test(name)) {
    return jsonResponse({ success: false, message: "Role name must be 2-50 lowercase letters or underscores" }, 400);
  }

  try {
    const result = await sql.unsafe(UPDATE_ROLE_QUERY, [id, name || null, description || null]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Role not found" }, 404);
    }
    return jsonResponse({ success: true, data: result[0] }, 200);
  } catch (error: any) {
    if (error.code === "23505") {
      return jsonResponse({ success: false, message: "Role with this name already exists" }, 409);
    }
    console.error("Error updating role:", error);
    return jsonResponse({ success: false, message: "Failed to update role" }, 500);
  }
}

export async function deleteRoleHandler(id: string): Promise<Response> {
  try {
    const result = await sql.unsafe(DELETE_ROLE_QUERY, [id]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Role not found" }, 404);
    }
    return jsonResponse({ success: true, message: "Role deleted successfully" }, 200);
  } catch (error) {
    console.error("Error deleting role:", error);
    return jsonResponse({ success: false, message: "Failed to delete role" }, 500);
  }
}

// =====================================================
// ROLE-PERMISSION ASSIGNMENT HANDLERS
// =====================================================

export async function assignPermissionsToRoleHandler(roleId: string, body: AssignPermissionsRequest): Promise<Response> {
  const { permission_ids } = body;

  if (!permission_ids || !Array.isArray(permission_ids)) {
    return jsonResponse({ success: false, message: "permission_ids array is required" }, 400);
  }

  try {
    // Clear existing permissions
    await sql.unsafe(CLEAR_ROLE_PERMISSIONS_QUERY, [roleId]);

    // Assign new permissions (only if array is not empty)
    if (permission_ids.length > 0) {
      for (const permId of permission_ids) {
        await sql.unsafe(ASSIGN_PERMISSION_TO_ROLE_QUERY, [roleId, permId]);
      }
    }

    // Fetch updated role with permissions
    const result = await sql.unsafe(GET_ROLE_WITH_PERMISSIONS_QUERY, [roleId]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Role not found" }, 404);
    }

    return jsonResponse({ success: true, data: result[0] }, 200);
  } catch (error: any) {
    if (error.code === "23503") {
      // Foreign key constraint violation
      return jsonResponse({ success: false, message: "Invalid role or permission ID" }, 400);
    }
    console.error("Error assigning permissions to role:", error);
    return jsonResponse({ success: false, message: "Failed to assign permissions" }, 500);
  }
}

export async function removePermissionFromRoleHandler(roleId: string, permissionId: string): Promise<Response> {
  try {
    const result = await sql.unsafe(REMOVE_PERMISSION_FROM_ROLE_QUERY, [roleId, permissionId]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "Permission assignment not found" }, 404);
    }
    return jsonResponse({ success: true, message: "Permission removed from role successfully" }, 200);
  } catch (error) {
    console.error("Error removing permission from role:", error);
    return jsonResponse({ success: false, message: "Failed to remove permission from role" }, 500);
  }
}

// =====================================================
// USER ROLE HANDLERS
// =====================================================

export async function getAllUsersWithRolesHandler(): Promise<Response> {
  try {
    const users = await sql.unsafe(GET_ALL_USERS_WITH_ROLES_QUERY);
    return jsonResponse({ success: true, data: users }, 200);
  } catch (error) {
    console.error("Error fetching users with roles:", error);
    return jsonResponse({ success: false, message: "Failed to fetch users" }, 500);
  }
}

export async function updateUserRoleHandler(userId: string, roleId: string | null): Promise<Response> {
  try {
    const result = await sql.unsafe(UPDATE_USER_ROLE_QUERY, [userId, roleId]);
    if (result.length === 0) {
      return jsonResponse({ success: false, message: "User not found" }, 404);
    }
    return jsonResponse({ success: true, data: result[0] }, 200);
  } catch (error: any) {
    if (error.code === "23503") {
      return jsonResponse({ success: false, message: "Invalid role ID" }, 400);
    }
    console.error("Error updating user role:", error);
    return jsonResponse({ success: false, message: "Failed to update user role" }, 500);
  }
}

// =====================================================
// PERMISSION CHECKING UTILITIES
// =====================================================

export async function getUserPermissionsHandler(userId: string): Promise<Response> {
  try {
    const result = await sql.unsafe(GET_USER_PERMISSIONS_QUERY, [userId]);
    const permissions = result.map((row: any) => row.name);
    return jsonResponse({ success: true, data: permissions }, 200);
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return jsonResponse({ success: false, message: "Failed to fetch user permissions" }, 500);
  }
}

export async function checkUserPermission(userId: number, permissionName: string): Promise<boolean> {
  try {
    const result = await sql.unsafe(CHECK_USER_PERMISSION_QUERY, [userId, permissionName]);
    return result[0]?.has_permission || false;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}
