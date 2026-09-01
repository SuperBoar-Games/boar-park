// Set password page for admin-created users to set their initial password

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../../components/Button';

export default function SetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
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
                                This link is invalid or has expired. Please contact an administrator.
                            </p>
                        </div>
                        <Link to="/auth/login">
                            <Button className="auth-submit">Go to Login</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/auth/login'), 2000);
            } else {
                setError(data.message || 'Failed to set password');
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
                            <h1 className="auth-success-title">Password Set!</h1>
                            <p className="auth-success-message">
                                Your password has been set successfully. You can now log in. Redirecting...
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
                        <h1 className="auth-title">Welcome!</h1>
                        <p className="auth-subtitle">
                            Set your password to complete your account setup.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label htmlFor="password" className="auth-label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                            {isLoading ? 'Setting password...' : 'Set Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
