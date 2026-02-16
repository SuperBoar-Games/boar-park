// Permission matrix component - resources as rows, roles as columns

import React, { useState } from 'react';
import { Icons } from '../Icons';
import { useAssignPermissionsToRole, useStartImpersonation } from '../../hooks/roles/useRolesMutations';
import type { SystemRole, Permission } from '../../hooks/roles/types';

interface PermissionMatrixProps {
  roles: SystemRole[];
  permissions: Permission[];
  onEditRole: (role: SystemRole) => void;
  onDeleteRole: (role: SystemRole) => void;
}

// Define hierarchical structure
const RESOURCE_HIERARCHY = [
  {
    name: 'games',
    level: 0,
    children: [
      {
        name: 'talkies',
        level: 1,
        children: [
          { name: 'heroes', level: 2 },
          { name: 'movies', level: 2 },
          { name: 'cards', level: 2 },
          { name: 'tags', level: 2 }
        ]
      }
    ]
  },
  {
    name: 'user_management',
    level: 0,
    children: [
      { name: 'users', level: 1 },
      { name: 'roles', level: 1 },
      { name: 'permissions', level: 1 }
    ]
  }
];

type InheritanceMode = 'inherit' | 'custom';

export function PermissionMatrix({ roles, permissions, onEditRole, onDeleteRole }: PermissionMatrixProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [inheritanceSettings, setInheritanceSettings] = useState<Record<string, Record<string, InheritanceMode>>>({});
  const assignPermissions = useAssignPermissionsToRole();
  const startImpersonation = useStartImpersonation();

  // Filter out admin role (admins always have all permissions)
  const nonAdminRoles = roles.filter(role => role.name.toLowerCase() !== 'admin');

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    const [resource] = perm.name.split(':');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  };

  const hasPermission = (role: SystemRole, permissionId: number): boolean => {
    return role.permissions?.some(p => p.id === permissionId) || false;
  };

  const togglePermission = (role: SystemRole, permissionId: number) => {
    const currentPermissions = role.permissions?.map(p => p.id) || [];
    const hasIt = currentPermissions.includes(permissionId);

    const newPermissionIds = hasIt
      ? currentPermissions.filter(id => id !== permissionId)
      : [...currentPermissions, permissionId];

    assignPermissions.mutate({
      roleId: role.id,
      permissionIds: newPermissionIds
    });
  };

  const toggleInheritance = (roleId: number, resource: string, currentMode: InheritanceMode) => {
    const newMode: InheritanceMode = currentMode === 'inherit' ? 'custom' : 'inherit';

    if (newMode === 'inherit') {
      // When switching to inherit mode, copy parent permissions to child
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const currentPermissions = role.permissions?.map(p => p.id) || [];
      const parentResource = getParentResource(resource);

      if (parentResource) {
        // Get parent permissions that THIS ROLE actually has (not all available parent permissions)
        const roleParentPerms = role.permissions?.filter(p => {
          const [res] = p.name.split(':');
          return res === parentResource;
        }) || [];

        // Get all available child permissions
        const childPerms = permissions.filter(p => {
          const [res] = p.name.split(':');
          return res === resource;
        });

        const childPermIds = childPerms.map(p => p.id);

        // Match parent actions that the role has to child actions
        const newChildPermIds = roleParentPerms.map(parentPerm => {
          const [, action] = parentPerm.name.split(':');
          const matchingChild = childPerms.find(cp => cp.name === `${resource}:${action}`);
          return matchingChild?.id;
        }).filter(Boolean) as number[];

        // Merge with existing permissions (removing old child perms, adding new ones)
        const otherPerms = currentPermissions.filter(id => !childPermIds.includes(id));
        const updatedPermissions = [...otherPerms, ...newChildPermIds];

        assignPermissions.mutate({
          roleId,
          permissionIds: updatedPermissions
        });
      }
    }

    setInheritanceSettings(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [resource]: newMode
      }
    }));
  };

  const getParentResource = (resource: string): string | null => {
    // Find parent in hierarchy
    for (const top of RESOURCE_HIERARCHY) {
      if ('children' in top && top.children) {
        for (const child of top.children) {
          if ('children' in child && child.children) {
            for (const grandchild of child.children) {
              if (grandchild.name === resource) {
                return child.name; // Parent is the middle level
              }
            }
          }
          if (child.name === resource) {
            return top.name; // Parent is the top level
          }
        }
      }
    }
    return null;
  };

  const getInheritanceMode = (roleId: number, resource: string): InheritanceMode => {
    // Check local state first
    if (inheritanceSettings[roleId]?.[resource]) {
      return inheritanceSettings[roleId][resource];
    }

    // Detect from actual permissions: if child permissions exactly match parent, it's inherited
    const role = roles.find(r => r.id === roleId);
    if (!role || !role.permissions) return 'custom';

    const parentResource = getParentResource(resource);
    if (!parentResource) return 'custom';

    // Get parent and child permissions for this role
    const parentPerms = role.permissions.filter(p => {
      const [res] = p.name.split(':');
      return res === parentResource;
    });

    const childPerms = role.permissions.filter(p => {
      const [res] = p.name.split(':');
      return res === resource;
    });

    // If no child perms, it's custom (not inherited)
    if (childPerms.length === 0) return 'custom';

    // Check if child permissions match parent permissions exactly
    const parentActions = new Set(parentPerms.map(p => p.name.split(':')[1]));
    const childActions = new Set(childPerms.map(p => p.name.split(':')[1]));

    // If sets are equal, it's inherited
    if (parentActions.size === childActions.size &&
        [...parentActions].every(action => childActions.has(action))) {
      return 'inherit';
    }

    return 'custom';
  };

  // Get sorted permissions (C, R, U, D order)
  const getSortedPermissions = (perms: Permission[]) => {
    const order = ['create', 'read', 'update', 'delete'];
    return perms.sort((a, b) => {
      const aAction = a.name.split(':')[1];
      const bAction = b.name.split(':')[1];
      return order.indexOf(aAction) - order.indexOf(bAction);
    });
  };

  // Recursively render resource rows
  const renderResourceRow = (node: any): React.ReactNode => {
    const perms = permissionsByResource[node.name];
    const isExpanded = expandedNodes.has(node.name);
    const hasChildren = node.children && node.children.length > 0;
    const indent = node.level * 1.5;

    // If no permissions and no children, skip this node entirely
    if (!perms && !hasChildren) return null;

    const sortedPerms = perms ? getSortedPermissions([...perms]) : [];

    return (
      <React.Fragment key={node.name}>
        {/* Resource Row */}
        <tr className={`resource-row level-${node.level}`}>
          <td className="resource-name-cell" style={{ paddingLeft: `${indent}rem` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.name)}
                className="resource-toggle"
              >
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="resource-name">{node.name.replace(/_/g, ' ')}</span>
              </button>
            ) : (
              <span className="resource-name no-children">
                {node.name.replace(/_/g, ' ')}
              </span>
            )}
          </td>

          {/* Role columns */}
          {nonAdminRoles.map(role => {
            const inheritMode = getInheritanceMode(role.id, node.name);

            return (
              <td key={role.id} className="role-permissions-group" colSpan={5}>
                <div className="permissions-row">
                  {/* Inherit checkbox */}
                  <div className="permission-cell inherit-cell">
                    {node.level > 0 && perms ? (
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={inheritMode === 'inherit'}
                          onChange={() => toggleInheritance(role.id, node.name, inheritMode)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    ) : null}
                  </div>

                  {/* CRUD checkboxes */}
                  {perms && (node.level === 0 || inheritMode === 'custom') ? (
                    sortedPerms.map(perm => (
                      <div key={perm.id} className="permission-cell">
                        <label className="custom-checkbox" title={perm.description || perm.name}>
                          <input
                            type="checkbox"
                            checked={hasPermission(role, perm.id)}
                            onChange={() => togglePermission(role, perm.id)}
                            disabled={assignPermissions.isPending}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                    ))
                  ) : (
                    // Empty cells when inherited or no perms
                    <>
                      <div className="permission-cell"></div>
                      <div className="permission-cell"></div>
                      <div className="permission-cell"></div>
                      <div className="permission-cell"></div>
                    </>
                  )}
                </div>
              </td>
            );
          })}
        </tr>

        {/* Child Resources (when expanded) */}
        {isExpanded && hasChildren && node.children.map((child: any) => renderResourceRow(child))}
      </React.Fragment>
    );
  };

  return (
    <div className="permission-matrix">
      <div className="matrix-header">
        <h3>Permission Matrix</h3>
        <p>Manage permissions by resource and role. I = Inherit from parent, C = Create, R = Read, U = Update, D = Delete</p>
      </div>

      {/* Roles Management Table */}
      <div className="roles-management-section">
        <h4>Roles</h4>
        <table className="roles-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td className="role-name-col">{role.name}</td>
                <td className="role-desc-col">{role.description || '—'}</td>
                <td className="role-actions-col">
                  <button
                    type="button"
                    onClick={() => onEditRole(role)}
                    className="action-button"
                    title="Edit role"
                  >
                    {Icons.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRole(role)}
                    className="action-button delete"
                    title="Delete role"
                  >
                    {Icons.delete}
                  </button>
                  <button
                    type="button"
                    onClick={() => startImpersonation.mutate(role.id)}
                    className="action-button impersonate"
                    title="View as this role"
                    disabled={startImpersonation.isPending}
                  >
                    {Icons.userSwitch}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="resource-column">Resource</th>
              {nonAdminRoles.map(role => (
                <th key={role.id} className="role-column-group" colSpan={5}>
                  <div className="role-header">
                    <span className="role-name">{role.name}</span>
                  </div>
                  <div className="permission-headers">
                    <div className="permission-header inherit-header">I</div>
                    <div className="permission-header">C</div>
                    <div className="permission-header">R</div>
                    <div className="permission-header">U</div>
                    <div className="permission-header">D</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESOURCE_HIERARCHY.map(node => renderResourceRow(node))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
