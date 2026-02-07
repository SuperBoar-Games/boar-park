// Request password reset page where users enter their email

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';

export default function RequestResetPage() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                setEmail('');
            } else {
                setError(data.message || 'Failed to send reset email');
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-text mb-2">Check Your Email</h1>
                            <p className="text-subtext0 mb-6">
                                If an account exists with that email, we've sent a password reset link. The link will expire in 1 hour.
                            </p>
                            <Link to="/auth/login">
                                <Button className="w-full">Back to Login</Button>
                            </Link>
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
                    <h1 className="text-3xl font-bold text-text mb-2 text-center">Reset Password</h1>
                    <p className="text-subtext0 text-center mb-6">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {error && (
                        <div className="bg-red/10 border border-red text-red rounded-lg p-3 mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-text font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-surface0 border border-surface2 rounded-lg text-text focus:outline-none focus:border-blue"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/auth/login" className="text-blue hover:text-sapphire transition-colors">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
