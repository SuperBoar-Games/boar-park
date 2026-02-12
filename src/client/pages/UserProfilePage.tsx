// User profile page for updating username, email, and password

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/auth/useAuthQueries';
import { useUpdateProfileMutation } from '../hooks/auth/useAuthMutations';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/Button';
import { Icons } from '../components/Icons';

export default function UserProfilePage() {
    const { logout } = useAuth();
    const { data: currentUser, isLoading: userLoading } = useCurrentUser();
    const updateProfileMutation = useUpdateProfileMutation();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Update form data when user data is loaded
    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                username: currentUser.username,
                email: currentUser.email,
            }));
        }
    }, [currentUser]);

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate password match
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            const result = await updateProfileMutation.mutateAsync({
                username: formData.username,
                email: formData.email,
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword || undefined,
            });

            if (result.success) {
                setSuccess('Profile updated successfully');
                setFormData({
                    username: formData.username,
                    email: formData.email,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                setError(result.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error. Please try again.');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (userLoading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ctp-subtext0)' }}>
                Loading profile...
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ctp-subtext0)' }}>
                Please log in to view your profile.
            </div>
        );
    }

    return (
        <AdminLayout
            title={<h1>My Profile</h1>}
            actions={
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    {Icons.arrowLeft} <span>Go Back</span>
                </Button>
            }
        >
            <div
                style={{
                    padding: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'calc(100vh - 60px)',
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
                            disabled={updateProfileMutation.isPending}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: 'var(--ctp-primary)',
                                color: 'var(--ctp-base)',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontWeight: 500,
                                cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer',
                                opacity: updateProfileMutation.isPending ? 0.5 : 1,
                            }}
                        >
                            {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
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
        </AdminLayout>
    );
}
