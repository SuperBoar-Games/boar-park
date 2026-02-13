// Admin users management page with CRUD, filtering, sorting, and role assignment

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Dropdown } from '../../components/Dropdown';
import { Icons } from '../../components/Icons';
import { UsersManagementMobile } from './UsersManagementMobile';
import { useUsersQuery, useRolesQuery, useGamesQuery } from '../../hooks/admin/useAdminQueries';
import {
  useCreateUserMutation,
  useApproveUserMutation,
  useDisableUserMutation,
  useDeleteUserMutation,
  useAssignRoleMutation,
  useRemoveRoleMutation,
  useSendResetEmailMutation,
} from '../../hooks/admin/useAdminMutations';

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
    const navigate = useNavigate();

    // Fetch data from React Query
    const { data: users = [], isLoading } = useUsersQuery();
    const { data: roles = [] } = useRolesQuery();
    const { data: games = [] } = useGamesQuery();

    // Mutations
    const createUser = useCreateUserMutation();
    const approveUser = useApproveUserMutation();
    const disableUser = useDisableUserMutation();
    const deleteUser = useDeleteUserMutation();
    const assignRole = useAssignRoleMutation();
    const removeRole = useRemoveRoleMutation();
    const sendResetEmail = useSendResetEmailMutation();

    // UI state only
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

    // Confirm dialogs
    const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ isOpen: boolean; userId: number; username: string }>({ isOpen: false, userId: 0, username: '' });
    const [removeRoleConfirm, setRemoveRoleConfirm] = useState<{ isOpen: boolean; userId: number; roleId: number; gameId: number | null; roleName: string }>({ isOpen: false, userId: 0, roleId: 0, gameId: null, roleName: '' });

    // Mobile detection
    const isMobile = useIsMobile();

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

    const handleCreateUser = async () => {
        setError('');
        setSuccess('');
        if (!newUser.username || !newUser.email || !newUser.roleId) {
            setError('Username, email, and role are required');
            return;
        }

        // Validate username format (no spaces, 3-32 chars, alphanumeric + underscore)
        const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
        if (!usernameRegex.test(newUser.username)) {
            setError('Username must be 3-32 characters (letters, numbers, underscore only - no spaces)');
            return;
        }

        // Check if game is required for non-admin roles
        const selectedRole = roles.find((r: Role) => r.id.toString() === newUser.roleId);
        if (selectedRole && selectedRole.name.toLowerCase() !== 'admin' && !newUser.gameId) {
            setError('Game selection is required for non-admin roles');
            return;
        }

        try {
            await createUser.mutateAsync({
                username: newUser.username,
                email: newUser.email,
                roleId: parseInt(newUser.roleId),
                gameId: newUser.gameId ? parseInt(newUser.gameId) : undefined,
            });
            setSuccess('User created successfully');
            setShowCreateModal(false);
            setNewUser({ username: '', email: '', roleId: '', gameId: '' });
        } catch (error: any) {
            // Show specific error message from backend if available
            setError(error?.message || 'Failed to create user');
        }
    };

    const handleApproveUser = async (userId: number) => {
        try {
            await approveUser.mutateAsync(userId);
            setSuccess('User approved');
        } catch (error) {
            setError('Failed to approve user');
        }
    };

    const handleDisableUser = async (userId: number) => {
        try {
            await disableUser.mutateAsync(userId);
            setSuccess('User disabled');
        } catch (error) {
            setError('Failed to disable user');
        }
    };

    const handleEnableUser = async (userId: number) => {
        try {
            await approveUser.mutateAsync(userId);
            setSuccess('User enabled');
        } catch (error) {
            setError('Failed to enable user');
        }
    };

    const handleDeleteUser = (user: User) => {
        setDeleteUserConfirm({ isOpen: true, userId: user.id, username: user.username });
    };

    const handleConfirmDeleteUser = async () => {
        try {
            await deleteUser.mutateAsync(deleteUserConfirm.userId);
            setSuccess('User deleted');
            setDeleteUserConfirm({ isOpen: false, userId: 0, username: '' });
        } catch (error) {
            setError('Failed to delete user');
        }
    };

    const handleCancelDeleteUser = () => {
        setDeleteUserConfirm({ isOpen: false, userId: 0, username: '' });
    };

    const handleAssignRole = async () => {
        setError('');
        if (!roleForm.roleId) {
            setError('Please select a role');
            return;
        }

        // Check if game is required for non-admin roles
        const selectedRole = roles.find((r: Role) => r.id.toString() === roleForm.roleId);
        if (selectedRole && selectedRole.name.toLowerCase() !== 'admin' && !roleForm.gameId) {
            setError('Game selection is required for non-admin roles');
            return;
        }

        // Check for duplicate role assignment
        if (selectedUser) {
            const isDuplicate = selectedUser.roles.some(
                r => r.roleId.toString() === roleForm.roleId &&
                     (r.gameId?.toString() === roleForm.gameId || (!r.gameId && !roleForm.gameId))
            );
            if (isDuplicate) {
                setError('This role is already assigned to the user');
                return;
            }
        }

        try {
            await assignRole.mutateAsync({
                userId: roleForm.userId,
                roleId: parseInt(roleForm.roleId),
                gameId: roleForm.gameId ? parseInt(roleForm.gameId) : undefined,
            });
            setSuccess('Role assigned');
            setShowRoleModal(false);
            setRoleForm({ userId: 0, roleId: '', gameId: '' });
        } catch (error: any) {
            setError(error?.message || 'Failed to assign role');
        }
    };

    const handleRemoveRole = (userId: number, roleId: number, gameId: number | null, roleName: string) => {
        setRemoveRoleConfirm({ isOpen: true, userId, roleId, gameId, roleName });
    };

    const handleConfirmRemoveRole = async () => {
        const { userId, roleId, gameId } = removeRoleConfirm;
        try {
            await removeRole.mutateAsync({ userId, roleId, gameId });
            setSuccess('Role removed');
            setRemoveRoleConfirm({ isOpen: false, userId: 0, roleId: 0, gameId: null, roleName: '' });
        } catch (error) {
            setError('Failed to remove role');
        }
    };

    const handleCancelRemoveRole = () => {
        setRemoveRoleConfirm({ isOpen: false, userId: 0, roleId: 0, gameId: null, roleName: '' });
    };

    const handleSendResetEmail = async (userId: number, userEmail: string, username: string) => {
        try {
            await sendResetEmail.mutateAsync(userId);
            setSuccess(`Password reset email sent to ${username}`);
        } catch (error) {
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
                !user.roles.some((r: any) => r.roleId.toString() === filters.role)
            ) {
                return false;
            }

            // Game filter
            if (
                filters.game &&
                !user.roles.some((r: any) => r.gameId?.toString() === filters.game)
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
            <AdminLayout
                title={<h1>User Management</h1>}
                actions={
                    <Button variant="secondary" onClick={() => navigate('/admin')}>
                        {Icons.arrowLeft} <span>Back to Admin</span>
                    </Button>
                }
            >
                <div className="users-management-container">
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ctp-subtext0)' }}>
                        Loading users...
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={<h1>User Management</h1>}
            actions={
                <Button variant="secondary" onClick={() => navigate('/admin')}>
                    {Icons.arrowLeft} <span>Back to Admin</span>
                </Button>
            }
        >
            {/* Toast Notifications */}
            {error && (
                <div className="toast-notification error">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="toast-notification success">
                    <span>✓</span>
                    <span>{success}</span>
                </div>
            )}

            <div className="users-management-container">
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
                        success={success}
                        error={error}
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
                                        <Dropdown
                                            value={filters.status}
                                            onChange={(value) =>
                                                setFilters({ ...filters, status: String(value) })
                                            }
                                            options={[
                                                { id: '', name: 'All' },
                                                { id: 'active', name: 'Active' },
                                                { id: 'pending', name: 'Pending' },
                                                { id: 'disabled', name: 'Disabled' },
                                            ]}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Dropdown
                                                value={filters.role}
                                                onChange={(value) =>
                                                    setFilters({ ...filters, role: String(value) })
                                                }
                                                options={[
                                                    { id: '', name: 'All' },
                                                    ...roles.map((role) => ({
                                                        id: role.id,
                                                        name: role.name,
                                                    })),
                                                ]}
                                            />
                                            <Dropdown
                                                value={filters.game}
                                                onChange={(value) =>
                                                    setFilters({ ...filters, game: String(value) })
                                                }
                                                options={[
                                                    { id: '', name: 'All' },
                                                    ...games.map((game) => ({
                                                        id: game.id,
                                                        name: game.name,
                                                    })),
                                                ]}
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
                                                    user.roles.map((role: any, idx: number) => (
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
                                                                    handleRemoveRole(user.id, role.roleId, role.gameId, role.roleName)
                                                                }
                                                                className="role-badge-remove"
                                                                title="Remove role"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                                {!user.roles.some((role: any) => role.roleName.toLowerCase() === 'admin') && (
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
                                                    <button
                                                        onClick={() => handleSendResetEmail(user.id, user.email, user.username)}
                                                        className="user-action-btn"
                                                        title="Send password reset email"
                                                        style={{ backgroundColor: 'var(--ctp-info-color, #89B4FA)', color: 'var(--ctp-base)' }}
                                                    >
                                                        Reset Email
                                                    </button>
                                                )}
                                                <div className="user-actions-secondary">
                                                    {user.status === 'active' && (
                                                        <button
                                                            onClick={() => handleDisableUser(user.id)}
                                                            className="user-action-btn disable"
                                                            title="Disable this user"
                                                        >
                                                            {Icons.disable}
                                                        </button>
                                                    )}
                                                    {user.status === 'disabled' && (
                                                        <button
                                                            onClick={() => handleEnableUser(user.id)}
                                                            className="user-action-btn approve"
                                                            title="Enable this user"
                                                        >
                                                            Enable
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="user-action-btn delete"
                                                        title="Delete this user permanently"
                                                    >
                                                        {Icons.delete}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create User Modal */}
                <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User">
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
                            <Dropdown
                                value={newUser.roleId}
                                onChange={(value) => setNewUser({ ...newUser, roleId: String(value) })}
                                options={roles}
                                placeholder="Select a role..."
                                required
                            />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Game (Optional)</label>
                            <Dropdown
                                value={newUser.gameId}
                                onChange={(value) => setNewUser({ ...newUser, gameId: String(value) })}
                                options={games}
                                placeholder="All games / Admin only"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="modal-btn modal-btn-secondary"
                            disabled={createUser.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateUser}
                            className="modal-btn modal-btn-primary"
                            disabled={createUser.isPending}
                        >
                            {createUser.isPending ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </Modal>

                {/* Assign Role Modal */}
                <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={`Assign Role to ${selectedUser?.username}`}>
                    <div className="modal-body">
                        {error && <div className="modal-error">{error}</div>}
                        <div className="modal-form-group">
                            <label className="modal-label">Role *</label>
                            <Dropdown
                                value={roleForm.roleId}
                                onChange={(value) => setRoleForm({ ...roleForm, roleId: String(value) })}
                                options={roles}
                                placeholder="Select a role..."
                                required
                            />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Game (Optional)</label>
                            <Dropdown
                                value={roleForm.gameId}
                                onChange={(value) => setRoleForm({ ...roleForm, gameId: String(value) })}
                                options={games}
                                placeholder="All games / Admin only"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="modal-btn modal-btn-secondary"
                            disabled={assignRole.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssignRole}
                            className="modal-btn modal-btn-primary"
                            disabled={assignRole.isPending}
                        >
                            {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
                        </button>
                    </div>
                </Modal>

                <ConfirmDialog
                    isOpen={deleteUserConfirm.isOpen}
                    title="Delete User"
                    message={`Are you sure you want to delete "${deleteUserConfirm.username}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleConfirmDeleteUser}
                    onCancel={handleCancelDeleteUser}
                    isDangerous
                />

                <ConfirmDialog
                    isOpen={removeRoleConfirm.isOpen}
                    title="Remove Role"
                    message={`Remove "${removeRoleConfirm.roleName}" role? This action cannot be undone.`}
                    confirmText="Remove"
                    cancelText="Cancel"
                    onConfirm={handleConfirmRemoveRole}
                    onCancel={handleCancelRemoveRole}
                    isDangerous
                />
            </div>
        </AdminLayout>
    );
}
