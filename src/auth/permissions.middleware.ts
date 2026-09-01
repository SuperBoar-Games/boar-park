// Permission-based authorization middleware

import { TokenPayload } from "./jwt";
import { checkUserPermission } from "../handlers/roles.handler";
import { forbiddenResponse } from "./middleware";

/**
 * Check if user has a specific permission
 * @param user - Authenticated user from JWT
 * @param permissionName - Permission to check (e.g., 'users:create', 'games:read')
 * @returns true if user has permission, false otherwise
 */
export async function hasPermission(user: TokenPayload, permissionName: string): Promise<boolean> {
  return await checkUserPermission(user.userId, permissionName);
}

/**
 * Check if user has ANY of the specified permissions
 * @param user - Authenticated user from JWT
 * @param permissionNames - Array of permissions to check
 * @returns true if user has at least one permission, false otherwise
 */
export async function hasAnyPermission(user: TokenPayload, permissionNames: string[]): Promise<boolean> {
  for (const perm of permissionNames) {
    if (await hasPermission(user, perm)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has ALL of the specified permissions
 * @param user - Authenticated user from JWT
 * @param permissionNames - Array of permissions to check
 * @returns true if user has all permissions, false otherwise
 */
export async function hasAllPermissions(user: TokenPayload, permissionNames: string[]): Promise<boolean> {
  for (const perm of permissionNames) {
    if (!(await hasPermission(user, perm))) {
      return false;
    }
  }
  return true;
}

/**
 * Middleware helper: require permission or return 403
 * @param user - Authenticated user from JWT
 * @param permissionName - Required permission
 * @returns null if authorized, Response if forbidden
 */
export async function requirePermission(user: TokenPayload, permissionName: string): Promise<Response | null> {
  const hasIt = await hasPermission(user, permissionName);
  if (!hasIt) {
    return forbiddenResponse(`Permission required: ${permissionName}`);
  }
  return null;
}

/**
 * Middleware helper: require ANY of the permissions or return 403
 * @param user - Authenticated user from JWT
 * @param permissionNames - Array of permissions (user needs at least one)
 * @returns null if authorized, Response if forbidden
 */
export async function requireAnyPermission(user: TokenPayload, permissionNames: string[]): Promise<Response | null> {
  const hasIt = await hasAnyPermission(user, permissionNames);
  if (!hasIt) {
    return forbiddenResponse(`One of these permissions required: ${permissionNames.join(", ")}`);
  }
  return null;
}

/**
 * Middleware helper: require ALL permissions or return 403
 * @param user - Authenticated user from JWT
 * @param permissionNames - Array of permissions (user needs all of them)
 * @returns null if authorized, Response if forbidden
 */
export async function requireAllPermissions(user: TokenPayload, permissionNames: string[]): Promise<Response | null> {
  const hasIt = await hasAllPermissions(user, permissionNames);
  if (!hasIt) {
    return forbiddenResponse(`All of these permissions required: ${permissionNames.join(", ")}`);
  }
  return null;
}
