// Password hashing, verification, and secure reset token generation using Argon2id

import argon2 from "argon2";

/**
 * Hash password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456, // 19 MiB
        timeCost: 2,
        parallelism: 1,
    });
}

/**
 * Verify password against hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error("Password verification failed:", error);
        return false;
    }
}

/**
 * Generate secure random token for password reset
 */
export function generateResetToken(): string {
    return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
}
