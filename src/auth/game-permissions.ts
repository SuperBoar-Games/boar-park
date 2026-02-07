// Game permissions validation and authorization helpers for role-based access control

import { sql } from "bun";
import { TokenPayload } from "./jwt";

/**
 * Get game ID from slug
 */
export async function getGameIdFromSlug(gameSlug: string): Promise<number | null> {
    try {
        const games = await sql`SELECT id FROM games WHERE slug = ${gameSlug}`;
        return games.length > 0 ? games[0].id : null;
    } catch (error) {
        return null;
    }
}

/**
 * Check if user is admin (has global admin role)
 */
export function isAdmin(user: TokenPayload): boolean {
    return user.roles.some(r => r.roleName === 'admin' && r.gameId === null);
}

/**
 * Check if user has at least viewer access to a game
 */
export function canViewGame(user: TokenPayload, gameId: number): boolean {
    // Admins can view all games
    if (isAdmin(user)) {
        return true;
    }

    // Check if user has any role for this game
    return user.roles.some(r => r.gameId === gameId);
}

/**
 * Check if user can edit content in a game (requires editor role or admin)
 */
export function canEditGame(user: TokenPayload, gameId: number): boolean {
    // Admins can edit all games
    if (isAdmin(user)) {
        return true;
    }

    // Check if user has editor role for this game
    return user.roles.some(r => r.gameId === gameId && r.roleName === 'editor');
}

/**
 * Get list of game IDs the user has access to
 */
export function getUserGameIds(user: TokenPayload): number[] {
    // Admins have access to all games (return null to indicate "all")
    if (isAdmin(user)) {
        return [];
    }

    // Get unique game IDs from user's roles
    const gameIds = user.roles
        .filter(r => r.gameId !== null)
        .map(r => r.gameId as number);

    return [...new Set(gameIds)];
}

/**
 * Filter games list by user access
 */
export async function getGamesForUser(user: TokenPayload | null): Promise<any[]> {
    if (!user) {
        return [];
    }

    // Admins see all games
    if (isAdmin(user)) {
        const games = await sql`
            SELECT id, slug, name, description, created_at, updated_at
            FROM games
            ORDER BY name
        `;
        return games;
    }

    // Get games user has access to
    const gameIds = getUserGameIds(user);
    if (gameIds.length === 0) {
        return [];
    }

    const games = await sql`
        SELECT id, slug, name, description, created_at, updated_at
        FROM games
        WHERE id = ANY(${gameIds})
        ORDER BY name
    `;

    return games;
}
