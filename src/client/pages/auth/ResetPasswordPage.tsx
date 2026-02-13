// Password reset page where users create a new password with reset token

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../../components/Button';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-wrapper">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h1 className="auth-title">Invalid Link</h1>
                            <p className="auth-subtitle">
                                This password reset link is invalid or has expired.
                            </p>
                        </div>
                        <Link to="/auth/request-reset">
                            <Button className="auth-submit">Request New Link</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/auth/login'), 2000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (error) {
            setError('Network error');
        }

        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-wrapper">
                    <div className="auth-card">
                        <div className="auth-success-container">
                            <div className="auth-success-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="auth-success-title">Password Reset!</h1>
                            <p className="auth-success-message">
                                Your password has been reset successfully. Redirecting to login...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Set New Password</h1>
                        <p className="auth-subtitle">
                            Enter your new password below.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label htmlFor="newPassword" className="auth-label">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="auth-input"
                                minLength={8}
                                required
                            />
                            <p className="auth-input-hint">At least 8 characters</p>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="confirmPassword" className="auth-label">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="auth-submit"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
