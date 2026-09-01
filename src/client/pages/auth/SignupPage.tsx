// User signup page with username, email, and password fields

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        const result = await signup(username, email, password);

        if (result.success) {
            setSuccess(true);
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } else {
            setError(result.message || 'Signup failed');
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
                            <h1 className="auth-success-title">Account Created!</h1>
                            <p className="auth-success-message">
                                Your account has been created successfully. Please wait for admin approval before you can log in.
                            </p>
                            <Link to="/auth/login">
                                <Button className="auth-submit">Go to Login</Button>
                            </Link>
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
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Sign up for a new account</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label htmlFor="username" className="auth-label">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="auth-input"
                                pattern="[a-zA-Z0-9_]{3,32}"
                                title="3-32 characters (letters, numbers, underscore)"
                                required
                            />
                            <p className="auth-input-hint">3-32 characters (letters, numbers, underscore)</p>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="email" className="auth-label">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>

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
                            {isLoading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p className="auth-footer-text">
                            Already have an account?{' '}
                            <Link to="/auth/login" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
