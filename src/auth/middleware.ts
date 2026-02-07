// Authentication middleware for JWT verification and authorization checks

import { verifyAccessToken, TokenPayload } from "./jwt";

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

/**
 * Extract bearer token from Authorization header
 */
function extractToken(request: Request): string | null {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Middleware to authenticate requests
 * Verifies JWT access token and attaches user to request
 */
export async function authenticate(request: Request): Promise<TokenPayload | null> {
    const token = extractToken(request);
    if (!token) {
        return null;
    }

    const payload = await verifyAccessToken(token);
    return payload;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: TokenPayload): boolean {
    if (!user.roles || user.roles.length === 0) {
        return false;
    }
    return user.roles.some((role) => role.roleName === "admin");
}

/**
 * Check if user has specific role
 */
export function hasRole(user: TokenPayload, roleName: string): boolean {
    if (!user.roles || user.roles.length === 0) {
        return false;
    }
    return user.roles.some((role) => role.roleName === roleName);
}

/**
 * Check if user has role for specific game
 */
export function hasRoleForGame(user: TokenPayload, gameId: number, roleName: string): boolean {
    if (!user.roles || user.roles.length === 0) {
        return false;
    }
    return user.roles.some((role) => role.gameId === gameId && role.roleName === roleName);
}

/**
 * Check if user has any role for specific game
 */
export function hasAnyRoleForGame(user: TokenPayload, gameId: number): boolean {
    if (!user.roles || user.roles.length === 0) {
        return false;
    }
    return user.roles.some((role) => role.gameId === gameId);
}

/**
 * Response helper for unauthorized access
 */
export function unauthorizedResponse(message: string = "Unauthorized"): Response {
    return new Response(JSON.stringify({ success: false, message }), {
        status: 401,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

/**
 * Response helper for forbidden access
 */
export function forbiddenResponse(message: string = "Forbidden"): Response {
    return new Response(JSON.stringify({ success: false, message }), {
        status: 403,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
