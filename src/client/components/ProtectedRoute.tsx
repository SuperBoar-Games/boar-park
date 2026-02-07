// Route wrapper that requires authentication and optional admin role or specific role

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireRole?: string;
}

export function ProtectedRoute({ children, requireAdmin = false, requireRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user, isAdmin: checkIsAdmin, hasRole } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="text-text">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    if (requireAdmin && !checkIsAdmin()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="bg-mantle rounded-lg shadow-lg p-8 max-w-md">
                    <h1 className="text-2xl font-bold text-text mb-2">Access Denied</h1>
                    <p className="text-subtext0">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    if (requireRole && !hasRole(requireRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="bg-mantle rounded-lg shadow-lg p-8 max-w-md">
                    <h1 className="text-2xl font-bold text-text mb-2">Access Denied</h1>
                    <p className="text-subtext0">You don't have the required role to access this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
