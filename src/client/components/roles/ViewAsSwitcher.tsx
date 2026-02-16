// View As switcher for admin to impersonate roles for debugging

import { useState, useRef, useEffect } from 'react';
import { useRoles } from '../../hooks/roles/useRolesQueries';
import { useStartImpersonation, useStopImpersonation } from '../../hooks/roles/useRolesMutations';
import { useImpersonationState } from '../../hooks/roles/useRolesQueries';
import { Icons } from '../Icons';
import type { SystemRole } from '../../hooks/roles/types';

export function ViewAsSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: roles = [] } = useRoles(false);
  const { data: impersonationState } = useImpersonationState();
  const startImpersonation = useStartImpersonation();
  const stopImpersonation = useStopImpersonation();

  const isImpersonating = impersonationState?.is_impersonating || false;
  const impersonatedRoleName = impersonationState?.impersonated_role_name;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectRole = (role: SystemRole) => {
    startImpersonation.mutate(role.id, {
      onSuccess: () => {
        setIsOpen(false);
        // Force page reload to reflect new permissions
        window.location.reload();
      },
      onError: (error: any) => {
        alert(`Failed to start impersonation: ${error.message}`);
      }
    });
  };

  const handleStopImpersonation = () => {
    stopImpersonation.mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        // Force page reload to reflect original permissions
        window.location.reload();
      },
      onError: (error: any) => {
        alert(`Failed to stop impersonation: ${error.message}`);
      }
    });
  };

  return (
    <div className="view-as-switcher" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`view-as-button ${isImpersonating ? 'impersonating' : ''}`}
        title={isImpersonating ? `Viewing as: ${impersonatedRoleName}` : 'View as role (admin debug)'}
      >
        {Icons.user}
        <span className="view-as-label">
          {isImpersonating ? `Viewing as: ${impersonatedRoleName}` : 'View As'}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="view-as-dropdown">
          {isImpersonating && (
            <>
              <div className="dropdown-header">
                <span className="impersonating-badge">Currently Impersonating</span>
              </div>
              <button
                type="button"
                onClick={handleStopImpersonation}
                className="dropdown-item stop-impersonation"
                disabled={stopImpersonation.isPending}
              >
                {Icons.close}
                <span>Stop Viewing As</span>
              </button>
              <div className="dropdown-divider" />
            </>
          )}

          <div className="dropdown-header">
            <span>Switch to Role:</span>
          </div>

          {roles.length === 0 ? (
            <div className="dropdown-empty">No roles available</div>
          ) : (
            roles.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelectRole(role)}
                className={`dropdown-item ${
                  isImpersonating && impersonationState?.impersonated_role_id === role.id
                    ? 'active'
                    : ''
                }`}
                disabled={startImpersonation.isPending}
              >
                <span className="role-name">{role.name}</span>
                {role.description && <small className="role-description">{role.description}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
