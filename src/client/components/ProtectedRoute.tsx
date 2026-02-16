// Route wrapper that requires authentication and optional admin role, specific role, or permissions

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissionCheck } from '../hooks/auth/usePermissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireRole?: string;
    requirePermission?: string; // Single permission (e.g., 'heroes:read')
    requireAnyPermission?: string[]; // At least one of these permissions
}

export function ProtectedRoute({
    children,
    requireAdmin = false,
    requireRole,
    requirePermission,
    requireAnyPermission
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user, isAdmin: checkIsAdmin, hasRole } = useAuth();
    const { hasPermission, hasAnyPermission: checkAnyPermission, isLoading: permissionsLoading } = usePermissionCheck();

    if (isLoading || permissionsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="text-text">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    // Check admin requirement
    if (requireAdmin && !checkIsAdmin()) {
        return <Navigate to="/admin" replace />;
    }

    // Check role requirement
    if (requireRole && !hasRole(requireRole)) {
        return <Navigate to="/admin" replace />;
    }

    // Check single permission requirement
    if (requirePermission && !hasPermission(requirePermission)) {
        return <Navigate to="/admin" replace />;
    }

    // Check any permission requirement
    if (requireAnyPermission && !checkAnyPermission(requireAnyPermission)) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
