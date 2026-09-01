// Roles & Permissions tab for Users Management page

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { RoleEditor } from './RoleEditor';
import { PermissionMatrix } from './PermissionMatrix';
import { usePermissions, useRoles, useImpersonationState } from '../../hooks/roles/useRolesQueries';
import {
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useStopImpersonation
} from '../../hooks/roles/useRolesMutations';
import type { SystemRole } from '../../hooks/roles/types';

export function RolesPermissionsTab() {
  const { isAdmin } = useAuth();
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; role: SystemRole | null }>({
    isOpen: false,
    role: null
  });

  // Queries
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
  const { data: roles = [], isLoading: rolesLoading } = useRoles(true);
  const { data: impersonationState } = useImpersonationState(isAdmin()); // Only fetch for admins

  // Mutations
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const stopImpersonation = useStopImpersonation();

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleEditor(true);
  };

  const handleEditRole = (role: SystemRole) => {
    setEditingRole(role);
    setShowRoleEditor(true);
  };

  const handleSaveRole = (data: { name: string; description: string }) => {
    if (editingRole) {
      // Update role metadata only
      updateRole.mutate(
        {
          id: editingRole.id,
          data: { name: data.name, description: data.description }
        },
        {
          onSuccess: () => {
            setShowRoleEditor(false);
            setEditingRole(null);
          }
        }
      );
    } else {
      // Create new role without permissions
      createRole.mutate(data, {
        onSuccess: () => {
          setShowRoleEditor(false);
        }
      });
    }
  };

  const handleDeleteRole = (role: SystemRole) => {
    setDeleteConfirm({ isOpen: true, role });
  };

  const confirmDeleteRole = () => {
    if (deleteConfirm.role) {
      deleteRole.mutate(deleteConfirm.role.id, {
        onSuccess: () => {
          setDeleteConfirm({ isOpen: false, role: null });
        }
      });
    }
  };

  const isLoading = permissionsLoading || rolesLoading || createRole.isPending || updateRole.isPending;

  return (
    <div className="roles-permissions-tab">
      {/* Impersonation Banner */}
      {impersonationState?.is_impersonating && (
        <div className="impersonation-banner">
          <div className="banner-content">
            <i className="fa-solid fa-user-secret"></i>
            <span>
              Currently viewing as role: <strong>{impersonationState.impersonated_role_name}</strong>
            </span>
          </div>
          <Button
            onClick={() => stopImpersonation.mutate()}
            variant="danger"
            disabled={stopImpersonation.isPending}
          >
            Stop Impersonation
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="tab-header">
        <h2>Roles & Permissions</h2>
        <div className="tab-actions">
          <Button onClick={handleCreateRole}>
            Create New Role
          </Button>
        </div>
      </div>

      {/* Permission Matrix View */}
      <div className="matrix-view">
        {isLoading ? (
          <div className="loading-state">Loading roles and permissions...</div>
        ) : roles.length === 0 ? (
          <div className="empty-state">
            <p>No roles created yet.</p>
            <Button onClick={handleCreateRole}>Create Your First Role</Button>
          </div>
        ) : (
          <PermissionMatrix
            roles={roles}
            permissions={permissions}
            onEditRole={handleEditRole}
            onDeleteRole={handleDeleteRole}
          />
        )}
      </div>

      {/* Role Editor Modal */}
      {showRoleEditor && (
        <RoleEditor
          role={editingRole}
          onSave={handleSaveRole}
          onCancel={() => {
            setShowRoleEditor(false);
            setEditingRole(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Delete Role Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Role"
        message={`Delete the "${deleteConfirm.role?.name}" role? Anyone currently holding it loses it.`}
        confirmText="Delete Role"
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteConfirm({ isOpen: false, role: null })}
        isDangerous={true}
      />
    </div>
  );
}
