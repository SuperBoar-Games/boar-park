// User profile page for updating username, email, and password

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export default function UserProfilePage() {
    const { user, accessToken, logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess('Profile updated successfully');
                setFormData({
                    username: formData.username,
                    email: formData.email,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ctp-subtext0)' }}>
                Please log in to view your profile.
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--ctp-base)',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    backgroundColor: 'var(--ctp-surface0)',
                    border: '1px solid var(--ctp-surface1)',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                }}
            >
                <h1 style={{ color: 'var(--ctp-text)', marginBottom: '2rem', fontSize: '1.75rem' }}>
                    My Profile
                </h1>

                {error && (
                    <div
                        style={{
                            backgroundColor: 'rgba(255, 100, 100, 0.1)',
                            border: '1px solid #ff6464',
                            color: '#ff6464',
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            marginBottom: '1rem',
                        }}
                    >
                        {error}
                    </div>
                )}
                {success && (
                    <div
                        style={{
                            backgroundColor: 'rgba(0, 200, 100, 0.1)',
                            border: '1px solid #00c864',
                            color: '#00c864',
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            marginBottom: '1rem',
                        }}
                    >
                        {success}
                    </div>
                )}

                <form onSubmit={handleUpdateProfile}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ctp-text)', fontWeight: 500 }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-base)',
                                border: '1px solid var(--ctp-surface1)',
                                borderRadius: '0.375rem',
                                color: 'var(--ctp-text)',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ctp-text)', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-base)',
                                border: '1px solid var(--ctp-surface1)',
                                borderRadius: '0.375rem',
                                color: 'var(--ctp-text)',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                            }}
                        />
                    </div>

                    <hr style={{ borderColor: 'var(--ctp-surface1)', margin: '2rem 0' }} />

                    <h3 style={{ color: 'var(--ctp-text)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        Change Password
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ctp-text)', fontWeight: 500 }}>
                            Current Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your current password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-base)',
                                border: '1px solid var(--ctp-surface1)',
                                borderRadius: '0.375rem',
                                color: 'var(--ctp-text)',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ctp-text)', fontWeight: 500 }}>
                            New Password (optional)
                        </label>
                        <input
                            type="password"
                            placeholder="Leave blank to keep current password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-base)',
                                border: '1px solid var(--ctp-surface1)',
                                borderRadius: '0.375rem',
                                color: 'var(--ctp-text)',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ctp-text)', fontWeight: 500 }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-base)',
                                border: '1px solid var(--ctp-surface1)',
                                borderRadius: '0.375rem',
                                color: 'var(--ctp-text)',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-primary)',
                                color: 'var(--ctp-base)',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontWeight: 500,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.5 : 1,
                            }}
                        >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-surface1)',
                                color: 'var(--ctp-text)',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
