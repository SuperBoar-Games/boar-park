// Authentication API handlers for signup, login, token refresh, and password reset

import { sql } from "bun";
import { jsonResponse } from "../utils";
import { hashPassword, verifyPassword, generateResetToken } from "../auth/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../auth/jwt";
import { sendPasswordResetEmail, sendSetPasswordEmail } from "../auth/email";
import {
    CREATE_USER_QUERY,
    GET_USER_BY_EMAIL_QUERY,
    GET_USER_BY_USERNAME_QUERY,
    GET_USER_BY_ID_QUERY,
    GET_USER_WITH_ROLES_QUERY,
    UPDATE_USER_PASSWORD_QUERY,
    CHECK_EMAIL_EXISTS_QUERY,
    CHECK_USERNAME_EXISTS_QUERY,
    CREATE_PASSWORD_RESET_QUERY,
    GET_PASSWORD_RESET_QUERY,
    MARK_PASSWORD_RESET_USED_QUERY,
    DELETE_USER_PASSWORD_RESETS_QUERY,
} from "../queries/auth.queries";

/**
 * Signup handler - creates pending user
 */
export async function signupHandler(body: any): Promise<Response> {
    const { username, email, password } = body;

    if (!username || !email || !password) {
        return jsonResponse(
            { success: false, message: "Username, email, and password are required" },
            400
        );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return jsonResponse({ success: false, message: "Invalid email format" }, 400);
    }

    // Validate username (alphanumeric, underscore, 3-32 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
        return jsonResponse(
            { success: false, message: "Username must be 3-32 characters (letters, numbers, underscore)" },
            400
        );
    }

    // Validate password strength
    if (password.length < 8) {
        return jsonResponse({ success: false, message: "Password must be at least 8 characters" }, 400);
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

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user with pending status
        const result = await sql.unsafe(CREATE_USER_QUERY, [
            username,
            email,
            passwordHash,
            "pending", // status
            false, // is_verified
        ]);

        return jsonResponse({
            success: true,
            message: "Account created successfully. Please wait for admin approval.",
            data: {
                id: result[0].id,
                username: result[0].username,
                email: result[0].email,
                status: result[0].status,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        return jsonResponse({ success: false, message: "Failed to create account" }, 500);
    }
}

/**
 * Login handler
 */
export async function loginHandler(body: any): Promise<Response> {
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
        return jsonResponse({ success: false, message: "Username/email and password are required" }, 400);
    }

    try {
        // Check if input is email or username
        const isEmail = usernameOrEmail.includes("@");
        const query = isEmail ? GET_USER_BY_EMAIL_QUERY : GET_USER_BY_USERNAME_QUERY;
        const users = await sql.unsafe(query, [usernameOrEmail]);

        if (users.length === 0) {
            return jsonResponse({ success: false, message: "Invalid credentials" }, 401);
        }

        const user = users[0];

        // Check if user is active
        if (user.status !== "active") {
            if (user.status === "pending") {
                return jsonResponse(
                    { success: false, message: "Account pending approval. Please wait for admin approval." },
                    403
                );
            }
            return jsonResponse({ success: false, message: "Account is disabled" }, 403);
        }

        // Verify password
        const isValid = await verifyPassword(user.password_hash, password);
        if (!isValid) {
            return jsonResponse({ success: false, message: "Invalid credentials" }, 401);
        }

        // Get user roles
        const userWithRoles = await sql.unsafe(GET_USER_WITH_ROLES_QUERY, [user.id]);
        const userData = userWithRoles[0];

        // Generate tokens
        const accessToken = await generateAccessToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            roles: userData.roles,
        });

        const refreshToken = await generateRefreshToken(user.id);

        return jsonResponse({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    status: user.status,
                    roles: userData.roles,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return jsonResponse({ success: false, message: "Login failed" }, 500);
    }
}

/**
 * Refresh token handler
 */
export async function refreshTokenHandler(body: any): Promise<Response> {
    const { refreshToken } = body;

    if (!refreshToken) {
        return jsonResponse({ success: false, message: "Refresh token is required" }, 400);
    }

    try {
        // Verify refresh token
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            return jsonResponse({ success: false, message: "Invalid or expired refresh token" }, 401);
        }

        // Get user with roles
        const userWithRoles = await sql.unsafe(GET_USER_WITH_ROLES_QUERY, [payload.userId]);
        if (userWithRoles.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        const user = userWithRoles[0];

        // Check if user is still active
        if (user.status !== "active") {
            return jsonResponse({ success: false, message: "Account is not active" }, 403);
        }

        // Generate new access token
        const accessToken = await generateAccessToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles,
        });

        return jsonResponse({
            success: true,
            message: "Token refreshed successfully",
            data: { accessToken },
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return jsonResponse({ success: false, message: "Failed to refresh token" }, 500);
    }
}

/**
 * Logout handler
 */
export async function logoutHandler(body: any): Promise<Response> {
    const { refreshToken } = body;

    if (!refreshToken) {
        return jsonResponse({ success: false, message: "Refresh token is required" }, 400);
    }

    try {
        await revokeRefreshToken(refreshToken);
        return jsonResponse({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return jsonResponse({ success: false, message: "Logout failed" }, 500);
    }
}

/**
 * Request password reset handler
 */
export async function requestPasswordResetHandler(body: any): Promise<Response> {
    const { email } = body;

    if (!email) {
        return jsonResponse({ success: false, message: "Email is required" }, 400);
    }

    try {
        // Check if user exists
        const users = await sql.unsafe(GET_USER_BY_EMAIL_QUERY, [email]);

        // Always return success (don't leak user existence)
        if (users.length === 0) {
            return jsonResponse({
                success: true,
                message: "If the email exists, a password reset link has been sent",
            });
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

        // Send email
        await sendPasswordResetEmail(user.email, user.username, resetToken);

        return jsonResponse({
            success: true,
            message: "If the email exists, a password reset link has been sent",
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        return jsonResponse({ success: false, message: "Failed to process request" }, 500);
    }
}

/**
 * Reset password handler (with token)
 */
export async function resetPasswordHandler(body: any): Promise<Response> {
    const { token, newPassword } = body;

    if (!token || !newPassword) {
        return jsonResponse({ success: false, message: "Token and new password are required" }, 400);
    }

    if (newPassword.length < 8) {
        return jsonResponse({ success: false, message: "Password must be at least 8 characters" }, 400);
    }

    try {
        // Verify reset token
        const resetTokens = await sql.unsafe(GET_PASSWORD_RESET_QUERY, [token]);

        if (resetTokens.length === 0) {
            return jsonResponse({ success: false, message: "Invalid or expired reset token" }, 400);
        }

        const resetToken = resetTokens[0];

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await sql.unsafe(UPDATE_USER_PASSWORD_QUERY, [passwordHash, resetToken.user_id]);

        // Mark token as used
        await sql.unsafe(MARK_PASSWORD_RESET_USED_QUERY, [token]);

        return jsonResponse({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Password reset error:", error);
        return jsonResponse({ success: false, message: "Failed to reset password" }, 500);
    }
}

/**
 * Set password handler (for admin-created users, first login)
 */
export async function setPasswordHandler(body: any): Promise<Response> {
    const { token, password } = body;

    if (!token || !password) {
        return jsonResponse({ success: false, message: "Token and password are required" }, 400);
    }

    if (password.length < 8) {
        return jsonResponse({ success: false, message: "Password must be at least 8 characters" }, 400);
    }

    try {
        // Verify reset token (same as password reset)
        const resetTokens = await sql.unsafe(GET_PASSWORD_RESET_QUERY, [token]);

        if (resetTokens.length === 0) {
            return jsonResponse({ success: false, message: "Invalid or expired token" }, 400);
        }

        const resetToken = resetTokens[0];

        // Hash password
        const passwordHash = await hashPassword(password);

        // Update password
        await sql.unsafe(UPDATE_USER_PASSWORD_QUERY, [passwordHash, resetToken.user_id]);

        // Mark token as used
        await sql.unsafe(MARK_PASSWORD_RESET_USED_QUERY, [token]);

        return jsonResponse({ success: true, message: "Password set successfully. You can now log in." });
    } catch (error) {
        console.error("Set password error:", error);
        return jsonResponse({ success: false, message: "Failed to set password" }, 500);
    }
}

/**
 * Get current user (from access token)
 */
export async function getCurrentUserHandler(userId: number): Promise<Response> {
    try {
        const userWithRoles = await sql.unsafe(GET_USER_WITH_ROLES_QUERY, [userId]);

        if (userWithRoles.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        const user = userWithRoles[0];

        return jsonResponse({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status,
                isVerified: user.is_verified,
                roles: user.roles,
            },
        });
    } catch (error) {
        console.error("Get current user error:", error);
        return jsonResponse({ success: false, message: "Failed to get user" }, 500);
    }
}

/**
 * Update current user profile
 */
export async function updateUserProfileHandler(userId: number, body: any): Promise<Response> {
    const { username, email, currentPassword, newPassword } = body;

    if (!currentPassword) {
        return jsonResponse({ success: false, message: "Current password is required" }, 400);
    }

    try {
        // Get current user
        const users = await sql.unsafe(GET_USER_BY_ID_QUERY, [userId]);
        if (users.length === 0) {
            return jsonResponse({ success: false, message: "User not found" }, 404);
        }

        const user = users[0];

        // Verify current password
        const passwordMatch = await verifyPassword(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return jsonResponse({ success: false, message: "Invalid current password" }, 401);
        }

        // Validate new values if provided
        if (username && username !== user.username) {
            const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
            if (!usernameRegex.test(username)) {
                return jsonResponse(
                    { success: false, message: "Username must be 3-32 characters (letters, numbers, underscore)" },
                    400
                );
            }
            const usernameCheck = await sql.unsafe(CHECK_USERNAME_EXISTS_QUERY, [username]);
            if (usernameCheck[0]?.count > 0) {
                return jsonResponse({ success: false, message: "Username already taken" }, 409);
            }
        }

        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return jsonResponse({ success: false, message: "Invalid email format" }, 400);
            }
            const emailCheck = await sql.unsafe(CHECK_EMAIL_EXISTS_QUERY, [email]);
            if (emailCheck[0]?.count > 0) {
                return jsonResponse({ success: false, message: "Email already registered" }, 409);
            }
        }

        // Update username
        if (username && username !== user.username) {
            await sql`UPDATE users SET username = ${username} WHERE id = ${userId}`;
        }

        // Update email
        if (email && email !== user.email) {
            await sql`UPDATE users SET email = ${email} WHERE id = ${userId}`;
        }

        // Update password
        if (newPassword) {
            if (newPassword.length < 8) {
                return jsonResponse({ success: false, message: "Password must be at least 8 characters" }, 400);
            }
            const newPasswordHash = await hashPassword(newPassword);
            await sql.unsafe(UPDATE_USER_PASSWORD_QUERY, [newPasswordHash, userId]);
        }

        // Get updated user
        const updatedUsers = await sql.unsafe(GET_USER_WITH_ROLES_QUERY, [userId]);
        const updatedUser = updatedUsers[0];

        return jsonResponse({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                status: updatedUser.status,
            },
        });
    } catch (error) {
        console.error("Update user profile error:", error);
        return jsonResponse({ success: false, message: "Failed to update profile" }, 500);
    }
}
