// Role impersonation middleware for admin debugging

import { TokenPayload } from "./jwt";
import { sql } from "bun";
import { jsonResponse } from "../utils";
import type { ImpersonationState } from "../types/roles.types";

// In-memory store for impersonation sessions (session_id -> impersonated_role_id)
// In production, this should be Redis or database-backed
const impersonationSessions = new Map<string, number>();

/**
 * Start impersonation session
 * Admin can impersonate a role to see UI/permissions as that role
 * @param user - Authenticated admin user
 * @param roleId - Role ID to impersonate
 * @param sessionId - Unique session identifier (could be access token)
 */
export async function startImpersonation(
  user: TokenPayload,
  roleId: number,
  sessionId: string
): Promise<Response> {
  // Verify role exists
  const roleCheck = await sql.unsafe(
    `SELECT id, name FROM system_roles WHERE id = $1`,
    [roleId]
  );

  if (roleCheck.length === 0) {
    return jsonResponse({ success: false, message: "Role not found" }, 404);
  }

  // Store impersonation session
  impersonationSessions.set(sessionId, roleId);

  return jsonResponse({
    success: true,
    message: `Now viewing as role: ${roleCheck[0].name}`,
    data: {
      is_impersonating: true,
      impersonated_role_id: roleId,
      impersonated_role_name: roleCheck[0].name
    }
  }, 200);
}

/**
 * Stop impersonation session
 * @param sessionId - Session identifier
 */
export async function stopImpersonation(sessionId: string): Promise<Response> {
  const wasImpersonating = impersonationSessions.has(sessionId);
  impersonationSessions.delete(sessionId);

  return jsonResponse({
    success: true,
    message: wasImpersonating ? "Impersonation stopped" : "Not currently impersonating",
    data: {
      is_impersonating: false,
      impersonated_role_id: null,
      impersonated_role_name: null
    }
  }, 200);
}

/**
 * Get current impersonation state
 * @param sessionId - Session identifier
 */
export async function getImpersonationState(sessionId: string): Promise<ImpersonationState> {
  const impersonatedRoleId = impersonationSessions.get(sessionId) || null;

  if (!impersonatedRoleId) {
    return {
      is_impersonating: false,
      original_role_id: null,
      impersonated_role_id: null,
      impersonated_role_name: null
    };
  }

  // Fetch role name
  const roleResult = await sql.unsafe(
    `SELECT name FROM system_roles WHERE id = $1`,
    [impersonatedRoleId]
  );

  return {
    is_impersonating: true,
    original_role_id: null, // Could be extracted from user's actual role
    impersonated_role_id: impersonatedRoleId,
    impersonated_role_name: roleResult[0]?.name || null
  };
}

/**
 * Get effective role ID for permission checks
 * If impersonating, return impersonated role ID
 * Otherwise, return user's actual role ID
 * @param sessionId - Session identifier
 * @param actualRoleId - User's actual role ID from database
 */
export function getEffectiveRoleId(sessionId: string, actualRoleId: number | null): number | null {
  const impersonatedRoleId = impersonationSessions.get(sessionId);
  return impersonatedRoleId || actualRoleId;
}

/**
 * Check if user is currently impersonating
 * @param sessionId - Session identifier
 */
export function isImpersonating(sessionId: string): boolean {
  return impersonationSessions.has(sessionId);
}

/**
 * Middleware: Get user permissions considering impersonation
 * @param user - Authenticated user
 * @param sessionId - Session identifier (e.g., access token hash)
 */
export async function getUserPermissionsWithImpersonation(
  user: TokenPayload,
  sessionId: string
): Promise<string[]> {
  // Get user's actual role_id from database
  const userResult = await sql.unsafe(
    `SELECT role_id FROM users WHERE id = $1`,
    [user.userId]
  );

  const actualRoleId = userResult[0]?.role_id || null;
  const effectiveRoleId = getEffectiveRoleId(sessionId, actualRoleId);

  if (!effectiveRoleId) {
    return []; // No role assigned
  }

  // Fetch permissions for effective role
  const permissionsResult = await sql.unsafe(
    `SELECT DISTINCT p.name
     FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = $1`,
    [effectiveRoleId]
  );

  return permissionsResult.map((row: any) => row.name);
}

/**
 * Extract session ID from request
 * Uses access token as session identifier
 */
export function extractSessionId(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  // Use token itself as session ID (could hash it for security)
  return authHeader.substring(7);
}
