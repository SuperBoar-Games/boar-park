// Email service for sending password reset and notification emails via SMTP

import nodemailer from "nodemailer";

// SMTP configuration from environment
const SMTP_HOST = process.env.SMTP_HOST || "smtp.protonmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Create transporter
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
): Promise<boolean> {
    try {
        const resetLink = `${APP_URL}/auth/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"Boar Park" <${FROM_EMAIL}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Password Reset Request</h2>
                        <p>Hi ${username},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <a href="${resetLink}" class="button">Reset Password</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${resetLink}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request a password reset, you can safely ignore this email.</p>
                        <div class="footer">
                            <p>This is an automated message from Boar Park. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hi ${username},

We received a request to reset your password. Visit the following link to create a new password:

${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

---
This is an automated message from Boar Park. Please do not reply to this email.
            `.trim(),
        });

        return true;
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        console.warn("Email service unavailable - password reset links won't be sent. Set up SMTP to enable email.");
        return true; // Return true to not block the flow
    }
}

/**
 * Send account approved email (when admin approves pending user)
 */
export async function sendAccountApprovedEmail(
    email: string,
    username: string
): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"Boar Park" <${FROM_EMAIL}>`,
            to: email,
            subject: "Account Approved - Welcome to Boar Park",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Welcome to Boar Park!</h2>
                        <p>Hi ${username},</p>
                        <p>Great news! Your account has been approved by an administrator. You can now log in and start using Boar Park.</p>
                        <a href="${APP_URL}/auth/login" class="button">Log In</a>
                        <div class="footer">
                            <p>This is an automated message from Boar Park. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hi ${username},

Great news! Your account has been approved by an administrator. You can now log in and start using Boar Park.

Visit: ${APP_URL}/auth/login

---
This is an automated message from Boar Park. Please do not reply to this email.
            `.trim(),
        });

        return true;
    } catch (error) {
        console.error("Failed to send account approved email:", error);
        console.warn("Email service unavailable - user won't be notified of approval. Set up SMTP to enable email.");
        return true; // Return true to not block the flow
    }
}

/**
 * Send set password email (for admin-created users)
 */
export async function sendSetPasswordEmail(
    email: string,
    username: string,
    resetToken: string
): Promise<boolean> {
    try {
        const setPasswordLink = `${APP_URL}/auth/set-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"Boar Park" <${FROM_EMAIL}>`,
            to: email,
            subject: "Set Your Password - Boar Park",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Welcome to Boar Park!</h2>
                        <p>Hi ${username},</p>
                        <p>An administrator has created an account for you. Click the button below to set your password:</p>
                        <a href="${setPasswordLink}" class="button">Set Password</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${setPasswordLink}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <div class="footer">
                            <p>This is an automated message from Boar Park. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hi ${username},

An administrator has created an account for you. Visit the following link to set your password:

${setPasswordLink}

This link will expire in 1 hour.

---
This is an automated message from Boar Park. Please do not reply to this email.
            `.trim(),
        });

        return true;
    } catch (error) {
        console.error("Failed to send set password email:", error);
        console.warn("Email service unavailable - user won't receive setup link. Set up SMTP to enable email.");
        return true; // Return true to not block the flow
    }
}
