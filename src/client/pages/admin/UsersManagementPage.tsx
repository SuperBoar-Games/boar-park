// Admin users management page with CRUD, filtering, sorting, and role assignment

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Icons } from '../../components/Icons';
import { UsersManagementMobile } from './UsersManagementMobile';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

async function fetchWithTokenRefresh(
    url: string,
    options: RequestInit,
    getToken: () => string | null,
    refreshToken: () => Promise<boolean>
): Promise<Response> {
    let token = getToken();
    const headers = { ...options.headers, ...(token && { 'Authorization': `Bearer ${token}` }) };

    let response = await fetch(url, { ...options, headers });

    // If 401/403 and token exists, try refreshing and retrying
    if ((response.status === 401 || response.status === 403) && token) {
        const refreshed = await refreshToken();
        if (refreshed) {
            token = getToken();
            const newHeaders = { ...options.headers, ...(token && { 'Authorization': `Bearer ${token}` }) };
            response = await fetch(url, { ...options, headers: newHeaders });
        }
    }

    return response;
}

interface User {
    id: number;
    username: string;
    email: string;
    status: string;
    is_verified: boolean;
    created_at: string;
    roles: Array<{
        gameId: number | null;
        gameName: string | null;
        roleId: number;
        roleName: string;
    }>;
}

interface Role {
    id: number;
    name: string;
}

interface Game {
    id: number;
    slug: string;
    name: string;
}

export default function UsersManagementPage() {
    const { accessToken, refreshAccessToken } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newUser, setNewUser] = useState({ username: '', email: '', roleId: '', gameId: '' });
    const [roleForm, setRoleForm] = useState({ userId: 0, roleId: '', gameId: '' });

    // Filter state
    const [filters, setFilters] = useState({
        username: '',
        email: '',
        status: '',
        role: '',
        game: '',
        search: '', // Combined search for mobile
    });

    // Sort state
    const [sort, setSort] = useState({ field: 'username', direction: 'asc' as 'asc' | 'desc' });

    // Mobile detection
    const isMobile = useIsMobile();

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-dismiss success/error messages after 4 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, rolesRes, gamesRes] = await Promise.all([
                fetchWithTokenRefresh(
                    `${API_BASE_URL}/api/admin/users`,
                    {},
                    () => localStorage.getItem('accessToken'),
                    refreshAccessToken
                ),
                fetchWithTokenRefresh(
                    `${API_BASE_URL}/api/admin/roles`,
                    {},
                    () => localStorage.getItem('accessToken'),
                    refreshAccessToken
                ),
                fetchWithTokenRefresh(
                    `${API_BASE_URL}/api/admin/games`,
                    {},
                    () => localStorage.getItem('accessToken'),
                    refreshAccessToken
                ),
            ]);

            if (usersRes.ok && rolesRes.ok && gamesRes.ok) {
                const usersData = await usersRes.json();
                const rolesData = await rolesRes.json();
                const gamesData = await gamesRes.json();

                setUsers(usersData.data);
                setRoles(rolesData.data);
                setGames(gamesData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data');
        }
        setIsLoading(false);
    };

    const handleCreateUser = async () => {
        setError('');
        setSuccess('');
        if (!newUser.username || !newUser.email || !newUser.roleId) {
            setError('Username, email, and role are required');
            return;
        }

        try {
            const response = await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/users`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: newUser.username,
                        email: newUser.email,
                        roleId: parseInt(newUser.roleId),
                        gameId: newUser.gameId ? parseInt(newUser.gameId) : null,
                    }),
                },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess('User created successfully');
                setShowCreateModal(false);
                setNewUser({ username: '', email: '', roleId: '', gameId: '' });
                fetchData();
            } else {
                setError(data.message || 'Failed to create user');
            }
        } catch (error) {
            setError('Network error');
        }
    };

    const handleApproveUser = async (userId: number) => {
        try {
            const response = await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/users/${userId}/approve`,
                { method: 'POST' },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );

            if (response.ok) {
                setSuccess('User approved');
                fetchData();
            }
        } catch (error) {
            console.error('Error approving user:', error);
            setError('Failed to approve user');
        }
    };

    const handleDisableUser = async (userId: number) => {
        try {
            const response = await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/users/${userId}/disable`,
                { method: 'POST' },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );

            if (response.ok) {
                setSuccess('User disabled');
                fetchData();
            }
        } catch (error) {
            console.error('Error disabling user:', error);
            setError('Failed to disable user');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/users/${userId}`,
                { method: 'DELETE' },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );

            if (response.ok) {
                setSuccess('User deleted');
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setError('Failed to delete user');
        }
    };

    const handleAssignRole = async () => {
        setError('');
        if (!roleForm.roleId) {
            setError('Please select a role');
            return;
        }

        try {
            const response = await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/assign-role`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: roleForm.userId,
                        roleId: parseInt(roleForm.roleId),
                        gameId: roleForm.gameId ? parseInt(roleForm.gameId) : null,
                    }),
                },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );

            if (response.ok) {
                setSuccess('Role assigned');
                setShowRoleModal(false);
                setRoleForm({ userId: 0, roleId: '', gameId: '' });
                fetchData();
            }
        } catch (error) {
            setError('Network error');
        }
    };

    const handleRemoveRole = async (userId: number, roleId: number, gameId: number | null) => {
        if (!confirm('Remove this role?')) return;

        try {
            await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/remove-role`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, roleId, gameId }),
                },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );
            setSuccess('Role removed');
            fetchData();
        } catch (error) {
            console.error('Error removing role:', error);
            setError('Failed to remove role');
        }
    };

    const handleSendResetEmail = async (userId: number, userEmail: string, username: string) => {
        try {
            const response = await fetchWithTokenRefresh(
                `${API_BASE_URL}/api/admin/users/${userId}/send-reset-email`,
                { method: 'POST' },
                () => localStorage.getItem('accessToken'),
                refreshAccessToken
            );

            const data = await response.json();
            if (response.ok) {
                setSuccess(`Password reset email sent to ${username}`);
            } else {
                setError(data.message || 'Failed to send reset email');
            }
        } catch (error) {
            console.error('Error sending reset email:', error);
            setError('Failed to send reset email');
        }
    };

    const getRoleBadgeColor = (roleName: string) => {
        const colors: Record<string, string> = {
            admin: 'rgba(255, 100, 100, 0.2)',
            editor: 'rgba(100, 150, 255, 0.2)',
            designer: 'rgba(150, 100, 255, 0.2)',
            reviewer: 'rgba(100, 200, 255, 0.2)',
            viewer: 'rgba(150, 150, 150, 0.2)',
        };
        return colors[roleName.toLowerCase()] || 'rgba(100, 150, 255, 0.2)';
    };

    // Filter and sort users
    const filteredAndSortedUsers = users
        .filter((user) => {
            // Combined search filter (for mobile)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (
                    !user.username.toLowerCase().includes(searchLower) &&
                    !user.email.toLowerCase().includes(searchLower)
                ) {
                    return false;
                }
            } else {
                // Individual filters (for desktop)
                // Username filter
                if (
                    filters.username &&
                    !user.username.toLowerCase().includes(filters.username.toLowerCase())
                ) {
                    return false;
                }

                // Email filter
                if (
                    filters.email &&
                    !user.email.toLowerCase().includes(filters.email.toLowerCase())
                ) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && user.status !== filters.status) {
                return false;
            }

            // Role filter
            if (
                filters.role &&
                !user.roles.some((r) => r.roleId.toString() === filters.role)
            ) {
                return false;
            }

            // Game filter
            if (
                filters.game &&
                !user.roles.some((r) => r.gameId?.toString() === filters.game)
            ) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            let aValue: string | number = '';
            let bValue: string | number = '';

            switch (sort.field) {
                case 'username':
                    aValue = a.username.toLowerCase();
                    bValue = b.username.toLowerCase();
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status.toLowerCase();
                    bValue = b.status.toLowerCase();
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
                default:
                    aValue = a.username.toLowerCase();
                    bValue = b.username.toLowerCase();
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sort.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sort.direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        });

    const handleSort = (field: string) => {
        if (sort.field === field) {
            setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
        } else {
            setSort({ field, direction: 'asc' });
        }
    };

    const getSortIcon = (field: string) => {
        if (sort.field !== field) return Icons.sort;
        return sort.direction === 'asc' ? Icons.sortUp : Icons.sortDown;
    };

    if (isLoading) {
        return (
            <AdminLayout title={<h1>User Management</h1>}>
                <div className="users-management-container">
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ctp-subtext0)' }}>
                        Loading users...
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={<h1>User Management</h1>}>
            <div className="users-management-container">
                {error && (
                    <div className="modal-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="modal-success" style={{ marginBottom: '1rem' }}>
                        {success}
                    </div>
                )}

                {!isMobile && (
                    <div className="users-management-header">
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--ctp-text)' }}>
                            All Users
                        </h2>
                        <Button onClick={() => setShowCreateModal(true)}>
                            + Create User
                        </Button>
                    </div>
                )}

                {isMobile ? (
                    <UsersManagementMobile
                        users={users}
                        roles={roles}
                        games={games}
                        filters={filters}
                        setFilters={setFilters}
                        sort={sort}
                        handleSort={handleSort}
                        filteredAndSortedUsers={filteredAndSortedUsers}
                        isLoading={isLoading}
                        showCreateModal={showCreateModal}
                        setShowCreateModal={setShowCreateModal}
                        showRoleModal={showRoleModal}
                        setShowRoleModal={setShowRoleModal}
                        selectedUser={selectedUser}
                        setSelectedUser={setSelectedUser}
                        newUser={newUser}
                        setNewUser={setNewUser}
                        roleForm={roleForm}
                        setRoleForm={setRoleForm}
                        handleApproveUser={handleApproveUser}
                        handleDisableUser={handleDisableUser}
                        handleDeleteUser={handleDeleteUser}
                        handleSendResetEmail={handleSendResetEmail}
                        handleCreateUser={handleCreateUser}
                        handleAssignRole={handleAssignRole}
                        handleRemoveRole={handleRemoveRole}
                        getRoleBadgeColor={getRoleBadgeColor}
                    />
                ) : users.length === 0 ? (
                    <div className="users-empty">
                        No users found. Create one to get started.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th className="sortable text-left" onClick={() => handleSort('username')}>
                                        <div className="sort-header">
                                            Username {getSortIcon('username')}
                                        </div>
                                    </th>
                                    <th className="sortable text-left" onClick={() => handleSort('email')}>
                                        <div className="sort-header">
                                            Email {getSortIcon('email')}
                                        </div>
                                    </th>
                                    <th className="sortable text-center" onClick={() => handleSort('status')}>
                                        <div className="sort-header">
                                            Status {getSortIcon('status')}
                                        </div>
                                    </th>
                                    <th className="text-left">Roles & Games</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                                <tr className="filter-row">
                                    <td className="filter-combined-desktop">
                                        <input
                                            type="text"
                                            placeholder="Filter username..."
                                            className="filter-input"
                                            value={filters.username}
                                            onChange={(e) =>
                                                setFilters({ ...filters, username: e.target.value })
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="filter-combined-desktop">
                                        <input
                                            type="text"
                                            placeholder="Filter email..."
                                            className="filter-input"
                                            value={filters.email}
                                            onChange={(e) =>
                                                setFilters({ ...filters, email: e.target.value })
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="filter-combined-mobile" style={{ display: 'none' }}>
                                        <input
                                            type="text"
                                            placeholder="Search username or email..."
                                            className="filter-input"
                                            value={filters.search}
                                            onChange={(e) =>
                                                setFilters({ ...filters, search: e.target.value })
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td>
                                        <Select
                                            value={filters.status}
                                            onChange={(value) =>
                                                setFilters({ ...filters, status: value })
                                            }
                                            options={[
                                                { value: '', label: 'All' },
                                                { value: 'active', label: 'Active' },
                                                { value: 'pending', label: 'Pending' },
                                                { value: 'disabled', label: 'Disabled' },
                                            ]}
                                            className="filter-input"
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Select
                                                value={filters.role}
                                                onChange={(value) =>
                                                    setFilters({ ...filters, role: value })
                                                }
                                                options={[
                                                    { value: '', label: 'All' },
                                                    ...roles.map((role) => ({
                                                        value: role.id.toString(),
                                                        label: role.name,
                                                    })),
                                                ]}
                                                className="filter-input"
                                            />
                                            <Select
                                                value={filters.game}
                                                onChange={(value) =>
                                                    setFilters({ ...filters, game: value })
                                                }
                                                options={[
                                                    { value: '', label: 'All' },
                                                    ...games.map((game) => ({
                                                        value: game.id.toString(),
                                                        label: game.name,
                                                    })),
                                                ]}
                                                className="filter-input"
                                            />
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td className="username text-left">{user.username}</td>
                                        <td className="email text-left">{user.email}</td>
                                        <td className="text-center">
                                            <span className={`status-badge ${user.status.toLowerCase()}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="text-left">
                                            <div className="user-roles">
                                                {user.roles.length === 0 ? (
                                                    <span style={{ color: 'var(--ctp-subtext0)', fontSize: '0.85rem' }}>
                                                        No roles assigned
                                                    </span>
                                                ) : (
                                                    user.roles.map((role, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="role-badge"
                                                            style={{ backgroundColor: getRoleBadgeColor(role.roleName) }}
                                                        >
                                                            <div className="role-badge-name">
                                                                <span>{role.roleName}</span>
                                                                {role.gameName && (
                                                                    <span
                                                                        className="role-badge-game"
                                                                        style={{
                                                                            fontSize: '0.75rem',
                                                                            color: 'var(--ctp-subtext0)',
                                                                        }}
                                                                    >
                                                                        ({role.gameName})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveRole(user.id, role.roleId, role.gameId)
                                                                }
                                                                className="role-badge-remove"
                                                                title="Remove role"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                                {!user.roles.some(role => role.roleName.toLowerCase() === 'admin') && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setRoleForm({ userId: user.id, roleId: '', gameId: '' });
                                                            setShowRoleModal(true);
                                                        }}
                                                        className="role-badge-add"
                                                        title="Add role"
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="user-actions">
                                                {user.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleApproveUser(user.id)}
                                                        className="user-action-btn approve"
                                                        title="Approve this user"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {user.status === 'active' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleSendResetEmail(user.id, user.email, user.username)}
                                                            className="user-action-btn"
                                                            title="Send password reset email"
                                                            style={{ backgroundColor: 'var(--ctp-info-color, #89B4FA)', color: 'var(--ctp-base)' }}
                                                        >
                                                            Reset Email
                                                        </button>
                                                        <button
                                                            onClick={() => handleDisableUser(user.id)}
                                                            className="user-action-btn disable"
                                                            title="Disable this user"
                                                        >
                                                            {Icons.disable}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="user-action-btn delete"
                                                    title="Delete this user permanently"
                                                >
                                                    {Icons.delete}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create User Modal */}
                <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
                    <div className="modal-header">
                        <h2 className="modal-title">Create New User</h2>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="modal-close"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="modal-error">{error}</div>}
                        <div className="modal-form-group">
                            <label className="modal-label">Username *</label>
                            <input
                                type="text"
                                placeholder="johndoe"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                className="modal-input"
                            />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Email *</label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="modal-input"
                            />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Role *</label>
                            <select
                                value={newUser.roleId}
                                onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                                className="modal-select"
                            >
                                <option value="">Select a role...</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Game (Optional)</label>
                            <select
                                value={newUser.gameId}
                                onChange={(e) => setNewUser({ ...newUser, gameId: e.target.value })}
                                className="modal-select"
                            >
                                <option value="">All games / Admin only</option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {game.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="modal-btn modal-btn-secondary"
                        >
                            Cancel
                        </button>
                        <button onClick={handleCreateUser} className="modal-btn modal-btn-primary">
                            Create User
                        </button>
                    </div>
                </Modal>

                {/* Assign Role Modal */}
                <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            Assign Role to {selectedUser?.username}
                        </h2>
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="modal-close"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="modal-error">{error}</div>}
                        <div className="modal-form-group">
                            <label className="modal-label">Role *</label>
                            <select
                                value={roleForm.roleId}
                                onChange={(e) => setRoleForm({ ...roleForm, roleId: e.target.value })}
                                className="modal-select"
                            >
                                <option value="">Select a role...</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Game (Optional)</label>
                            <select
                                value={roleForm.gameId}
                                onChange={(e) => setRoleForm({ ...roleForm, gameId: e.target.value })}
                                className="modal-select"
                            >
                                <option value="">All games / Admin only</option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {game.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="modal-btn modal-btn-secondary"
                        >
                            Cancel
                        </button>
                        <button onClick={handleAssignRole} className="modal-btn modal-btn-primary">
                            Assign Role
                        </button>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}
