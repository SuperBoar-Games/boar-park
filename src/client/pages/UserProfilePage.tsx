// User profile page for updating username, email, and password

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/auth/useAuthQueries';
import { useUpdateProfileMutation } from '../hooks/auth/useAuthMutations';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/Button';

const CRUMBS = [{ label: 'Admin', to: '/admin' }];

export default function UserProfilePage() {
    const { logout, user: authUser } = useAuth();
    const { data: fetchedUser } = useCurrentUser();

    // AuthContext already holds the signed-in user, so render from that
    // immediately and let the query refresh in the background. Waiting on
    // useCurrentUser meant a second full-page loading state *after* the route
    // gate had already resolved — two spinners in a row for data we had.
    const currentUser = fetchedUser ?? authUser;
    const userLoading = !currentUser;
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
            setError('The new passwords don’t match.');
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
                setSuccess(
                    formData.newPassword
                        ? 'Profile and password updated.'
                        : 'Profile updated.',
                );
                setFormData({
                    username: formData.username,
                    email: formData.email,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                setError(result.message || 'Couldn’t save your changes.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error. Try again.');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (userLoading) {
        return (
            <AdminLayout title={<h1>My profile</h1>} breadcrumbs={CRUMBS}>
                <div className="page-status">Loading your profile…</div>
            </AdminLayout>
        );
    }

    if (!currentUser) {
        return (
            <AdminLayout title={<h1>My profile</h1>} breadcrumbs={CRUMBS}>
                <div className="page-status">Sign in to view your profile.</div>
            </AdminLayout>
        );
    }

    const roles = currentUser.roles || [];
    const status = (currentUser as { status?: string }).status;

    return (
        <AdminLayout title={<h1>My profile</h1>} breadcrumbs={CRUMBS}>
            <form className="profile-page" onSubmit={handleUpdateProfile}>
                <div className="profile-main">
                {error && <div className="alert alert-error" role="alert">{error}</div>}
                {success && <div className="alert alert-success" role="status">{success}</div>}

                <section className="profile-section">
                    <div className="profile-section-head">
                        <h2 className="profile-section-title">Account</h2>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="profile-username">Username</label>
                            <input
                                id="profile-username"
                                type="text"
                                autoComplete="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-email">Email</label>
                            <input
                                id="profile-email"
                                type="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className="profile-section">
                    <div className="profile-section-head">
                        <h2 className="profile-section-title">New password</h2>
                        <span className="form-optional">Optional</span>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="profile-new-password">New password</label>
                            <input
                                id="profile-new-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Leave blank to keep your current one"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-confirm-password">Confirm new password</label>
                            <input
                                id="profile-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Type it again"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                {/* The server rejects any change without the current password,
                    so it's its own step rather than a field buried among the
                    password inputs — it authorises the whole form. */}
                <section className="profile-section">
                    <div className="profile-section-head">
                        <h2 className="profile-section-title">Confirm it’s you</h2>
                    </div>
                    {/* Field and its explanation sit side by side — a lone
                        password input would otherwise stretch the full card. */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="profile-current-password">Current password</label>
                            <input
                                id="profile-current-password"
                                type="password"
                                required
                                autoComplete="current-password"
                                placeholder="Your password right now"
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            />
                        </div>
                        <p className="profile-note profile-note-inline">
                            Required for every change on this page, including a username or email edit.
                        </p>
                    </div>
                </section>

                <div className="profile-actions">
                    <Button type="button" variant="danger" onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
                        <span>Log out</span>
                    </Button>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
                </div>

                {/* Identity lives in the rail — it's reference, not something
                    you edit, so it shouldn't sit in the middle of the form. */}
                <aside className="profile-aside">
                    <div className="profile-identity">
                        <span className="profile-avatar">
                            <i className="fa-regular fa-circle-user" aria-hidden="true" />
                        </span>
                        <div className="profile-identity-text">
                            <span className="profile-identity-name">{currentUser.username}</span>
                            <span className="profile-identity-email">{currentUser.email}</span>
                        </div>
                    </div>

                    {(roles.length > 0 || status) && (
                        <div className="profile-section">
                            <div className="profile-section-head">
                                <h2 className="profile-section-title">Access</h2>
                            </div>
                            {status && (
                                <div className="profile-aside-row">
                                    <span className="profile-aside-label">Status</span>
                                    <span className={`status-badge ${status === 'active' ? 'active' : 'pending'}`}>
                                        {status}
                                    </span>
                                </div>
                            )}
                            {roles.length > 0 && (
                                <div className="profile-aside-row">
                                    <span className="profile-aside-label">
                                        {roles.length === 1 ? 'Role' : 'Roles'}
                                    </span>
                                    <div className="profile-meta">
                                        {roles.map(role => (
                                            <span key={role.roleId} className="chip">{role.roleName}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <p className="profile-note">
                                Roles are managed by an administrator in user management.
                            </p>
                        </div>
                    )}
                </aside>
            </form>
        </AdminLayout>
    );
}
