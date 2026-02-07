// Mobile-optimized users management component with card-based layout

import React from 'react';
import { Icons } from '../../components/Icons';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import '../../styles/users-management-mobile.css';

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

interface UsersManagementMobileProps {
    users: User[];
    roles: Role[];
    games: Game[];
    filters: {
        username: string;
        email: string;
        status: string;
        role: string;
        game: string;
        search: string;
    };
    setFilters: (filters: any) => void;
    sort: { field: string; direction: 'asc' | 'desc' };
    handleSort: (field: string) => void;
    filteredAndSortedUsers: User[];
    isLoading: boolean;
    success: string;
    error: string;
    showCreateModal: boolean;
    setShowCreateModal: (show: boolean) => void;
    showRoleModal: boolean;
    setShowRoleModal: (show: boolean) => void;
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    handleApproveUser: (userId: number) => void;
    handleDisableUser: (userId: number) => void;
    handleDeleteUser: (userId: number) => void;
    handleSendResetEmail: (userId: number, email: string, username: string) => void;
    handleAssignRole: () => void;
    handleRemoveRole: (userId: number, roleId: number, gameId: number | null) => void;
    handleCreateUser: () => void;
    getRoleBadgeColor: (roleName: string) => string;
    newUser: { username: string; email: string; roleId: string; gameId: string };
    setNewUser: (user: any) => void;
    roleForm: { userId: number; roleId: string; gameId: string };
    setRoleForm: (form: any) => void;
}

export function UsersManagementMobile({
    users,
    roles,
    games,
    filters,
    setFilters,
    filteredAndSortedUsers,
    isLoading,
    success,
    error,
    showCreateModal,
    setShowCreateModal,
    showRoleModal,
    setShowRoleModal,
    selectedUser,
    setSelectedUser,
    handleApproveUser,
    handleDisableUser,
    handleDeleteUser,
    handleSendResetEmail,
    handleAssignRole,
    handleRemoveRole,
    handleCreateUser,
    getRoleBadgeColor,
    newUser,
    setNewUser,
    roleForm,
    setRoleForm,
}: UsersManagementMobileProps) {
    if (isLoading) {
        return (
            <div className="users-mobile-container">
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ctp-subtext0)' }}>
                    Loading users...
                </div>
            </div>
        );
    }

    return (
        <div className="users-mobile-container">
            {error && (
                <div className="mobile-alert mobile-alert-error">
                    {error}
                </div>
            )}
            {success && (
                <div className="mobile-alert mobile-alert-success">
                    {success}
                </div>
            )}

            <div className="mobile-header">
                <h2 className="mobile-title">All Users</h2>
                <Button onClick={() => setShowCreateModal(true)} className="mobile-create-btn">
                    {Icons.plus} Create User
                </Button>
            </div>

            <div className="mobile-search-wrapper">
                <input
                    type="text"
                    placeholder="Search username or email..."
                    className="mobile-search-input"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            {users.length === 0 ? (
                <div className="mobile-empty-state">
                    <p>No users found. Create one to get started.</p>
                </div>
            ) : filteredAndSortedUsers.length === 0 ? (
                <div className="mobile-empty-state">
                    <p>No users match your search.</p>
                </div>
            ) : (
                <div className="mobile-users-list">
                    {filteredAndSortedUsers.map((user) => (
                        <div key={user.id} className="mobile-user-card">
                            <div className="mobile-user-header">
                                <div className="mobile-user-info">
                                    <h3 className="mobile-username">{user.username}</h3>
                                    <p className="mobile-email">{user.email}</p>
                                </div>
                                <span className={`mobile-status-badge ${user.status.toLowerCase()}`}>
                                    {user.status}
                                </span>
                            </div>

                            {user.roles.length > 0 && (
                                <div className="mobile-roles-section">
                                    <div className="mobile-roles-list">
                                        {user.roles.map((role, idx) => (
                                            <div
                                                key={idx}
                                                className="mobile-role-badge"
                                                style={{ backgroundColor: getRoleBadgeColor(role.roleName) }}
                                            >
                                                <span className="mobile-role-name">{role.roleName}</span>
                                                {role.gameName && (
                                                    <span className="mobile-role-game">
                                                        ({role.gameName})
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleRemoveRole(user.id, role.roleId, role.gameId)
                                                    }
                                                    className="mobile-role-remove"
                                                    title="Remove role"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {!user.roles.some(role => role.roleName.toLowerCase() === 'admin') && (
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setRoleForm({ userId: user.id, roleId: '', gameId: '' });
                                                    setShowRoleModal(true);
                                                }}
                                                className="mobile-role-add-btn"
                                                title="Add role"
                                            >
                                                {Icons.plus}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mobile-actions-section">
                                {user.status === 'pending' && (
                                    <button
                                        onClick={() => handleApproveUser(user.id)}
                                        className="mobile-action-btn mobile-action-approve"
                                        title="Approve this user"
                                    >
                                        Approve
                                    </button>
                                )}
                                {user.status === 'active' && (
                                    <>
                                        <button
                                            onClick={() => handleSendResetEmail(user.id, user.email, user.username)}
                                            className="mobile-action-btn mobile-action-primary"
                                            title="Send password reset email"
                                        >
                                            Reset Email
                                        </button>
                                        <button
                                            onClick={() => handleDisableUser(user.id)}
                                            className="mobile-action-btn mobile-action-disable"
                                            title="Disable this user"
                                        >
                                            {Icons.disable}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="mobile-action-btn mobile-action-delete"
                                    title="Delete this user permanently"
                                >
                                    {Icons.delete}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New User"
                >
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
                    <div className="modal-footer">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="modal-btn modal-btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateUser}
                            className="modal-btn modal-btn-primary"
                        >
                            Create User
                        </button>
                    </div>
                </Modal>
            )}

            {/* Assign Role Modal */}
            {showRoleModal && (
                <Modal
                    isOpen={showRoleModal}
                    onClose={() => setShowRoleModal(false)}
                    title={`Assign Role to ${selectedUser?.username}`}
                >
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
                    <div className="modal-footer">
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="modal-btn modal-btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssignRole}
                            className="modal-btn modal-btn-primary"
                        >
                            Assign Role
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
