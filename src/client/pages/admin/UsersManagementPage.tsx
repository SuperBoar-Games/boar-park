// Admin users management page with CRUD, filtering, sorting, and role assignment

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Dropdown } from '../../components/Dropdown';
import { Icons } from '../../components/Icons';
import { UsersManagementMobile } from './UsersManagementMobile';
import { RolesPermissionsTab } from '../../components/roles/RolesPermissionsTab';
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

const USERS_CRUMBS = [{ label: 'Admin', to: '/admin' }];

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

    const [showFilters, setShowFilters] = useState(false);

    // Sort state
    const [sort, setSort] = useState({ field: 'username', direction: 'asc' as 'asc' | 'desc' });

    // Confirm dialogs
    const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ isOpen: boolean; userId: number; username: string }>({ isOpen: false, userId: 0, username: '' });
    const [removeRoleConfirm, setRemoveRoleConfirm] = useState<{ isOpen: boolean; userId: number; roleId: number; gameId: number | null; roleName: string }>({ isOpen: false, userId: 0, roleId: 0, gameId: null, roleName: '' });

    // Mobile detection
    const isMobile = useIsMobile();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tab state - persisted via URL
    const tabFromUrl = searchParams.get('tab') as 'users' | 'roles' | null;
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>(tabFromUrl || 'users');

    // Update URL when tab changes
    const handleTabChange = (tab: 'users' | 'roles') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

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

    const activeFilterCount = Object.values(filters).filter(Boolean).length;
    // Search lives in the toolbar, so only the rest count toward the badge
    const columnFilterCount = activeFilterCount - (filters.search ? 1 : 0);

    const clearFilters = () =>
        setFilters({ username: '', email: '', status: '', role: '', game: '', search: '' });

    // Roles were tinted from a hardcoded rgba() lookup — five arbitrary colours
    // that ignored the theme and gave 'designer' the same visual weight as
    // 'admin'. Roles are neutral chips now; only admin, which actually carries
    // elevated access, is marked.
    const roleBadgeClass = (roleName: string) =>
        roleName?.toLowerCase() === 'admin' ? 'role-badge is-admin' : 'role-badge';

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
            <AdminLayout title={<h1>User management</h1>} breadcrumbs={USERS_CRUMBS}>
                <div className="page-status">Loading users…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={<h1>User management</h1>} breadcrumbs={USERS_CRUMBS}>
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
                {/* Tabs Navigation */}
                <div className="management-tabs">
                    <button
                        type="button"
                        onClick={() => handleTabChange('users')}
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    >
                        Users
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('roles')}
                        className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
                    >
                        Roles & Permissions
                    </button>
                </div>

                {/* Users Tab Content */}
                {activeTab === 'users' && (
                    <>
                        {!isMobile && (
                            <div className="table-controls">
                                <div className="table-controls-left">
                                    <div className="search-field">
                                        <i className="fa-solid fa-magnifying-glass search-field-icon" aria-hidden="true" />
                                        <input
                                            type="search"
                                            className="search-field-input"
                                            placeholder="Search users"
                                            aria-label="Search users by name or email"
                                            value={filters.search}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        variant="secondary"
                                        aria-pressed={showFilters}
                                        className={showFilters ? 'is-active' : ''}
                                        onClick={() => setShowFilters(v => !v)}
                                    >
                                        {Icons.filter}
                                        <span>Filters</span>
                                        {columnFilterCount > 0 && (
                                            <span className="btn-count">{columnFilterCount}</span>
                                        )}
                                    </Button>
                                    {activeFilterCount > 0 && (
                                        <Button variant="ghost" onClick={clearFilters}>
                                            <span>Clear</span>
                                        </Button>
                                    )}
                                </div>
                                <Button onClick={() => setShowCreateModal(true)}>
                                    {Icons.plus} <span>Create user</span>
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
                        success={success}
                        error={error}
                    />
                ) : users.length === 0 ? (
                    <div className="users-empty">
                        No users found. Create one to get started.
                    </div>
                ) : (
                    <div className={`table-wrapper${showFilters ? ' is-filtering' : ''}`}>
                        <table className="data-table">
                            {/* Explicit widths so `table-layout: fixed` has a
                                source of truth and opening the filter row
                                can't resize the columns. Username and email
                                share whatever is left. */}
                            <colgroup>
                                <col />
                                <col />
                                <col style={{ width: '9rem' }} />
                                <col style={{ width: '22rem' }} />
                                <col style={{ width: '10rem' }} />
                            </colgroup>
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
                                {showFilters && (
                                <tr className="filter-row">
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            aria-label="Filter by username"
                                            className="filter-input"
                                            value={filters.username}
                                            onChange={(e) =>
                                                setFilters({ ...filters, username: e.target.value })
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Email"
                                            aria-label="Filter by email"
                                            className="filter-input"
                                            value={filters.email}
                                            onChange={(e) =>
                                                setFilters({ ...filters, email: e.target.value })
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
                                        <div className="filter-pair">
                                            <Dropdown
                                                value={filters.role}
                                                onChange={(value) =>
                                                    setFilters({ ...filters, role: String(value) })
                                                }
                                                options={[
                                                    { id: '', name: 'All roles' },
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
                                                    { id: '', name: 'All games' },
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
                                )}
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
                                                    <span className="user-roles-empty">No roles</span>
                                                ) : (
                                                    user.roles.map((role: any, idx: number) => (
                                                        <div key={idx} className={roleBadgeClass(role.roleName)}>
                                                            <div className="role-badge-name">
                                                                <span>{role.roleName}</span>
                                                                {role.gameName && (
                                                                    <span className="role-badge-game">
                                                                        {role.gameName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveRole(user.id, role.roleId, role.gameId, role.roleName)
                                                                }
                                                                className="role-badge-remove"
                                                                title={`Remove ${role.roleName}`}
                                                                aria-label={`Remove role ${role.roleName} from ${user.username}`}
                                                            >
                                                                {Icons.x}
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                                {!user.roles.some((role: any) => role.roleName?.toLowerCase() === 'admin') && (
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
                                            {/* One row of icon buttons, like every
                                                other table. This was a mix of
                                                text buttons, an inline-styled
                                                one and icons, stacked over two
                                                lines at uneven widths. Approve
                                                keeps a label because it's the
                                                one action a pending user is
                                                actually waiting on. */}
                                            <div className="action-buttons">
                                                {user.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveUser(user.id)}
                                                        className="user-action-btn approve"
                                                        title={`Approve ${user.username}`}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {user.status === 'disabled' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEnableUser(user.id)}
                                                        className="user-action-btn approve"
                                                        title={`Enable ${user.username}`}
                                                    >
                                                        Enable
                                                    </button>
                                                )}
                                                {user.status === 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendResetEmail(user.id, user.email, user.username)}
                                                        className="action-btn"
                                                        title={`Email a password reset link to ${user.username}`}
                                                        aria-label={`Send password reset email to ${user.username}`}
                                                    >
                                                        {/* A paper plane just means "send" — this is
                                                            specifically about credentials. */}
                                                        <i className="fa-solid fa-key" />
                                                    </button>
                                                )}
                                                {user.status === 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDisableUser(user.id)}
                                                        className="action-btn warning"
                                                        title={`Disable ${user.username}`}
                                                        aria-label={`Disable ${user.username}`}
                                                    >
                                                        {Icons.disable}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="action-btn delete"
                                                    title={`Delete ${user.username}`}
                                                    aria-label={`Delete ${user.username}`}
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
                    message={`Delete the account "${deleteUserConfirm.username}"? This can’	 be undone.`}
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
                    </>
                )}

                {/* Roles & Permissions Tab Content */}
                {activeTab === 'roles' && <RolesPermissionsTab />}
            </div>
        </AdminLayout>
    );
}
