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
            <div className="min-h-screen flex items-center justify-center bg-base p-4">
                <div className="w-full max-w-md">
                    <div className="bg-mantle rounded-lg shadow-lg p-8">
                        <h1 className="text-2xl font-bold text-text mb-2 text-center">Invalid Link</h1>
                        <p className="text-subtext0 text-center mb-6">
                            This link is invalid or has expired. Please contact an administrator.
                        </p>
                        <Link to="/auth/login">
                            <Button className="w-full">Go to Login</Button>
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
            <div className="min-h-screen flex items-center justify-center bg-base p-4">
                <div className="w-full max-w-md">
                    <div className="bg-mantle rounded-lg shadow-lg p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-text mb-2">Password Set!</h1>
                            <p className="text-subtext0 mb-6">
                                Your password has been set successfully. You can now log in. Redirecting...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base p-4">
            <div className="w-full max-w-md">
                <div className="bg-mantle rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-text mb-2 text-center">Welcome!</h1>
                    <p className="text-subtext0 text-center mb-6">
                        Set your password to complete your account setup.
                    </p>

                    {error && (
                        <div className="bg-red/10 border border-red text-red rounded-lg p-3 mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-text font-medium mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-surface0 border border-surface2 rounded-lg text-text focus:outline-none focus:border-blue"
                                minLength={8}
                                required
                            />
                            <p className="text-xs text-subtext0 mt-1">At least 8 characters</p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-text font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-surface0 border border-surface2 rounded-lg text-text focus:outline-none focus:border-blue"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Setting password...' : 'Set Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
