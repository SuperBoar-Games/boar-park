// JWT token generation, verification, and refresh token management

import { SignJWT, jwtVerify } from "jose";
import { sql } from "bun";

// JWT secrets from environment (should be set in .env)
const ACCESS_SECRET = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET || "change-this-access-secret-in-production"
);
const REFRESH_SECRET = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret-in-production"
);

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "2h"; // 2 hours
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days

export interface TokenPayload {
    userId: number;
    username: string;
    email: string;
    roles?: Array<{ gameId: number | null; roleName: string }>;
}

export interface RefreshTokenPayload {
    userId: number;
    tokenId: string;
}

/**
 * Generate access token (15 min expiry)
 */
export async function generateAccessToken(payload: TokenPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(ACCESS_SECRET);
}

/**
 * Generate refresh token (30 day expiry) and store in database
 */
export async function generateRefreshToken(userId: number): Promise<string> {
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const token = await new SignJWT({ userId, tokenId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(REFRESH_SECRET);

    // Store refresh token in database
    await sql`
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    `;

    return token;
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, ACCESS_SECRET);
        return payload as TokenPayload;
    } catch (error) {
        console.error("Access token verification failed:", error);
        return null;
    }
}

/**
 * Verify refresh token and check if it exists in database
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, REFRESH_SECRET);

        // Check if token exists and is not expired
        const result = await sql`
            SELECT user_id, expires_at
            FROM refresh_tokens
            WHERE token = ${token}
            AND expires_at > NOW()
            LIMIT 1
        `;

        if (result.length === 0) {
            return null;
        }

        return payload as RefreshTokenPayload;
    } catch (error) {
        console.error("Refresh token verification failed:", error);
        return null;
    }
}

/**
 * Revoke refresh token (delete from database)
 */
export async function revokeRefreshToken(token: string): Promise<void> {
    await sql`DELETE FROM refresh_tokens WHERE token = ${token}`;
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: number): Promise<void> {
    await sql`DELETE FROM refresh_tokens WHERE user_id = ${userId}`;
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
    await sql`DELETE FROM refresh_tokens WHERE expires_at < NOW()`;
}
