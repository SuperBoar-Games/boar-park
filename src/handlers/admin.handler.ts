// Admin API handlers for user management, roles, and games

import { sql } from "bun";
import { jsonResponse } from "../utils";
import { hashPassword, generateResetToken } from "../auth/password";
import { sendAccountApprovedEmail, sendSetPasswordEmail, sendPasswordResetEmail } from "../auth/email";
import {
    GET_ALL_USERS_QUERY,
    GET_PENDING_USERS_QUERY,
    GET_USER_BY_ID_QUERY,
    CREATE_USER_QUERY,
    UPDATE_USER_STATUS_QUERY,
    UPDATE_USER_EMAIL_QUERY,
    UPDATE_USER_USERNAME_QUERY,
    UPDATE_USER_PASSWORD_QUERY,
    DELETE_USER_QUERY,
    CHECK_EMAIL_EXISTS_QUERY,
    CHECK_USERNAME_EXISTS_QUERY,
    GET_ALL_ROLES_QUERY,
    ASSIGN_USER_ROLE_QUERY,
    REMOVE_USER_ROLE_QUERY,
    GET_USER_ROLES_QUERY,
    REMOVE_ALL_USER_ROLES_QUERY,
    GET_ALL_GAMES_QUERY,
    CREATE_PASSWORD_RESET_QUERY,
    DELETE_USER_PASSWORD_RESETS_QUERY,
} from "../queries/auth.queries";

/**
 * Get all users (admin only)
 */
export async function getAllUsersHandler(): Promise<Response> {
    try {
        const users = await sql.unsafe(GET_ALL_USERS_QUERY);
        return jsonResponse({ success: true, data: users });
    } catch (error) {
        console.error("Get all users error:", error);
        return jsonResponse({ success: false, message: "Failed to fetch users" }, 500);
    }
}

/**
 * Get pending users (admin only)
 */
export async function getPendingUsersHandler(): Promise<Response> {
    try {
        const users = await sql.unsafe(GET_PENDING_USERS_QUERY);
        return jsonResponse({ success: true, data: users });
    } catch (error) {
        console.error("Get pending users error:", error);
        return jsonResponse({ success: false, message: "Failed to fetch pending users" }, 500);
    }
}

/**
 * Approve user (admin only)
 */
export async function approveUserHandler(userId: number): Promise<Response> {
    try {
        // Update user status to active
        const result = await sql.unsafe(UPDATE_USER_STATUS_QUERY, ["active", userId]);

        if (result.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        const user = result[0];

        // Send approval email
        await sendAccountApprovedEmail(user.email, user.username);

        return jsonResponse({ success: true, message: "User approved successfully", data: user });
    } catch (error) {
        console.error("Approve user error:", error);
        return jsonResponse({ success: false, message: "Failed to approve user" }, 500);
    }
}

/**
 * Disable user (admin only)
 */
export async function disableUserHandler(userId: number): Promise<Response> {
    try {
        const result = await sql.unsafe(UPDATE_USER_STATUS_QUERY, ["disabled", userId]);

        if (result.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        return jsonResponse({ success: true, message: "User disabled successfully", data: result[0] });
    } catch (error) {
        console.error("Disable user error:", error);
        return jsonResponse({ success: false, message: "Failed to disable user" }, 500);
    }
}

/**
 * Create user (admin only) - assigns role/game, sends set password email
 */
export async function createUserHandler(body: any): Promise<Response> {
    const { username, email, roleId, gameId } = body;

    if (!username || !email || !roleId) {
        return jsonResponse(
            { success: false, message: "Username, email, and role are required" },
            400
        );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return jsonResponse({ success: false, message: "Invalid email format" }, 400);
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
        return jsonResponse(
            { success: false, message: "Username must be 3-32 characters (letters, numbers, underscore)" },
            400
        );
    }

    try {
        // Check if email already exists
        const emailCheck = await sql.unsafe(CHECK_EMAIL_EXISTS_QUERY, [email]);
        if (emailCheck[0]?.count > 0) {
            return jsonResponse({ success: false, message: "Email already registered" }, 409);
        }

        // Check if username already exists
        const usernameCheck = await sql.unsafe(CHECK_USERNAME_EXISTS_QUERY, [username]);
        if (usernameCheck[0]?.count > 0) {
            return jsonResponse({ success: false, message: "Username already taken" }, 409);
        }

        // Create user with active status but no password
        const result = await sql.unsafe(CREATE_USER_QUERY, [
            username,
            email,
            null, // no password yet
            "active", // status
            false, // is_verified
        ]);

        const newUser = result[0];

        // Assign role
        await sql.unsafe(ASSIGN_USER_ROLE_QUERY, [newUser.id, gameId || null, roleId]);

        // Generate set password token
        const resetToken = generateResetToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

        await sql.unsafe(CREATE_PASSWORD_RESET_QUERY, [newUser.id, resetToken, expiresAt.toISOString()]);

        // Send set password email
        await sendSetPasswordEmail(email, username, resetToken);

        return jsonResponse({
            success: true,
            message: "User created successfully. Set password email sent.",
            data: newUser,
        });
    } catch (error) {
        console.error("Create user error:", error);
        return jsonResponse({ success: false, message: "Failed to create user" }, 500);
    }
}

/**
 * Update user email (admin only)
 */
export async function updateUserEmailHandler(userId: number, body: any): Promise<Response> {
    const { email } = body;

    if (!email) {
        return jsonResponse({ success: false, message: "Email is required" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return jsonResponse({ success: false, message: "Invalid email format" }, 400);
    }

    try {
        // Check if email is already taken by another user
        const emailCheck = await sql.unsafe(CHECK_EMAIL_EXISTS_QUERY, [email]);
        if (emailCheck[0]?.count > 0) {
            const existingUser = await sql.unsafe(GET_USER_BY_ID_QUERY, [userId]);
            if (existingUser[0]?.email !== email) {
                return jsonResponse({ success: false, message: "Email already in use" }, 409);
            }
        }

        const result = await sql.unsafe(UPDATE_USER_EMAIL_QUERY, [email, userId]);

        if (result.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        return jsonResponse({ success: true, message: "Email updated successfully", data: result[0] });
    } catch (error) {
        console.error("Update email error:", error);
        return jsonResponse({ success: false, message: "Failed to update email" }, 500);
    }
}

/**
 * Update user username (admin only)
 */
export async function updateUserUsernameHandler(userId: number, body: any): Promise<Response> {
    const { username } = body;

    if (!username) {
        return jsonResponse({ success: false, message: "Username is required" }, 400);
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
        return jsonResponse(
            { success: false, message: "Username must be 3-32 characters (letters, numbers, underscore)" },
            400
        );
    }

    try {
        // Check if username is already taken by another user
        const usernameCheck = await sql.unsafe(CHECK_USERNAME_EXISTS_QUERY, [username]);
        if (usernameCheck[0]?.count > 0) {
            const existingUser = await sql.unsafe(GET_USER_BY_ID_QUERY, [userId]);
            if (existingUser[0]?.username !== username) {
                return jsonResponse({ success: false, message: "Username already taken" }, 409);
            }
        }

        const result = await sql.unsafe(UPDATE_USER_USERNAME_QUERY, [username, userId]);

        if (result.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        return jsonResponse({ success: true, message: "Username updated successfully", data: result[0] });
    } catch (error) {
        console.error("Update username error:", error);
        return jsonResponse({ success: false, message: "Failed to update username" }, 500);
    }
}

/**
 * Delete user (admin only)
 */
export async function deleteUserHandler(userId: number): Promise<Response> {
    try {
        await sql.unsafe(DELETE_USER_QUERY, [userId]);
        return jsonResponse({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return jsonResponse({ success: false, message: "Failed to delete user" }, 500);
    }
}

/**
 * Get all roles (admin only)
 */
export async function getAllRolesHandler(): Promise<Response> {
    try {
        const roles = await sql.unsafe(GET_ALL_ROLES_QUERY);
        return jsonResponse({ success: true, data: roles });
    } catch (error) {
        console.error("Get roles error:", error);
        return jsonResponse({ success: false, message: "Failed to fetch roles" }, 500);
    }
}

/**
 * Get all games (admin only)
 */
export async function getAllGamesHandler(): Promise<Response> {
    try {
        const games = await sql.unsafe(GET_ALL_GAMES_QUERY);
        return jsonResponse({ success: true, data: games });
    } catch (error) {
        console.error("Get games error:", error);
        return jsonResponse({ success: false, message: "Failed to fetch games" }, 500);
    }
}

/**
 * Assign role to user (admin only)
 */
export async function assignRoleHandler(body: any): Promise<Response> {
    const { userId, roleId, gameId } = body;

    if (!userId || !roleId) {
        return jsonResponse({ success: false, message: "User ID and role ID are required" }, 400);
    }

    try {
        await sql.unsafe(ASSIGN_USER_ROLE_QUERY, [userId, gameId || null, roleId]);
        return jsonResponse({ success: true, message: "Role assigned successfully" });
    } catch (error) {
        console.error("Assign role error:", error);
        return jsonResponse({ success: false, message: "Failed to assign role" }, 500);
    }
}

/**
 * Remove role from user (admin only)
 */
export async function removeRoleHandler(body: any): Promise<Response> {
    const { userId, roleId, gameId } = body;

    if (!userId || !roleId) {
        return jsonResponse({ success: false, message: "User ID and role ID are required" }, 400);
    }

    try {
        await sql.unsafe(REMOVE_USER_ROLE_QUERY, [userId, gameId || null, roleId]);
        return jsonResponse({ success: true, message: "Role removed successfully" });
    } catch (error) {
        console.error("Remove role error:", error);
        return jsonResponse({ success: false, message: "Failed to remove role" }, 500);
    }
}

/**
 * Get user roles (admin only)
 */
export async function getUserRolesHandler(userId: number): Promise<Response> {
    try {
        const roles = await sql.unsafe(GET_USER_ROLES_QUERY, [userId]);
        return jsonResponse({ success: true, data: roles });
    } catch (error) {
        console.error("Get user roles error:", error);
        return jsonResponse({ success: false, message: "Failed to fetch user roles" }, 500);
    }
}

/**
 * Send password reset email to a user (admin only)
 */
export async function sendResetEmailHandler(userId: number): Promise<Response> {
    try {
        // Get user
        const users = await sql.unsafe(GET_USER_BY_ID_QUERY, [userId]);
        if (users.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        const user = users[0];

        // Generate reset token
        const resetToken = generateResetToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

        // Delete old reset tokens for this user
        await sql.unsafe(DELETE_USER_PASSWORD_RESETS_QUERY, [user.id]);

        // Create new reset token
        await sql.unsafe(CREATE_PASSWORD_RESET_QUERY, [user.id, resetToken, expiresAt.toISOString()]);

        // Send password reset email
        await sendPasswordResetEmail(user.email, user.username, resetToken);

        return jsonResponse({ success: true, message: "Password reset email sent" });
    } catch (error) {
        console.error("Send reset email error:", error);
        return jsonResponse({ success: false, message: "Failed to send reset email" }, 500);
    }
}
