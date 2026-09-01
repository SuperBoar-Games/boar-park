import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStopImpersonation } from '../hooks/roles/useRolesMutations';

export function ImpersonationExitButton() {
    const { impersonationState } = useAuth();
    const stopImpersonation = useStopImpersonation();

    if (!impersonationState?.is_impersonating) return null;

    const handleExit = () => {
        stopImpersonation.mutate(undefined, {
            onSuccess: () => window.location.reload(),
            onError: (error: any) => alert(`Failed to stop impersonation: ${error.message}`)
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--ctp-surface0)',
                padding: '0.75rem 1rem',
                borderRadius: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '1px solid var(--ctp-red)',
            }}
        >
            <span style={{
                color: 'var(--ctp-text)',
                fontSize: '0.9rem',
                fontWeight: 500
            }}>
                Viewing as: <strong style={{ color: 'var(--ctp-red)' }}>{impersonationState.impersonated_role_name}</strong>
            </span>
            <button
                onClick={handleExit}
                style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
                title="Exit impersonation"
                aria-label="Exit impersonation"
            >
                ×
            </button>
        </div>
    );
}
