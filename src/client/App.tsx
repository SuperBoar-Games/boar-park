// Main application component with routing for all pages and layouts

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { queryClient } from './lib/queryClient';
import { initializeApiClient } from './lib/apiClient';
import { useSSE } from './hooks/useSSE';
import { usePushSubscription } from './hooks/notifications/usePushSubscription';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PlayCardsPage from './pages/games/PlayCardsPage';
import TalkiesGamePage from './pages/admin/talkies/TalkiesGamePage';
import HeroDetailsPage from './pages/admin/talkies/HeroDetailsPage';
import MovieDetailsPage from './pages/admin/talkies/MovieDetailsPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import NotificationHistoryPage from './pages/admin/NotificationHistoryPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import RequestResetPage from './pages/auth/RequestResetPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SetPasswordPage from './pages/auth/SetPasswordPage';
import { ImpersonationExitButton } from './components/ImpersonationExitButton';

// Injects PWA manifest + registers service worker only on /admin routes
function PwaLoader() {
    const { pathname } = useLocation();
    const { isAuthenticated } = useAuth();
    const isAdmin = pathname.startsWith('/admin');

    // Push subscription — set up when user is on /admin and authenticated
    usePushSubscription(isAdmin && isAuthenticated);

    useEffect(() => {
        const linkId = 'pwa-manifest';
        const existing = document.getElementById(linkId);

        if (isAdmin) {
            if (!existing) {
                // Inject manifest link
                const link = document.createElement('link');
                link.id = linkId;
                link.rel = 'manifest';
                link.href = '/manifest.json';
                document.head.appendChild(link);

                // Add apple PWA meta tags
                const metas = [
                    { name: 'theme-color', content: '#cba6f7' },
                    { name: 'apple-mobile-web-app-capable', content: 'yes' },
                    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
                    { name: 'apple-mobile-web-app-title', content: 'Boar Park' },
                ];
                metas.forEach(({ name, content }) => {
                    const meta = document.createElement('meta');
                    meta.name = name;
                    meta.content = content;
                    meta.dataset.pwa = 'true';
                    document.head.appendChild(meta);
                });

                // Add apple touch icon
                const appleIcon = document.createElement('link');
                appleIcon.rel = 'apple-touch-icon';
                appleIcon.href = '/icons/icon-512.png';
                appleIcon.dataset.pwa = 'true';
                document.head.appendChild(appleIcon);

                // Register service worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                }
            }
        } else {
            // Remove manifest and PWA meta tags when not on /admin
            existing?.remove();
            document.querySelectorAll('[data-pwa="true"]').forEach(el => el.remove());
        }
    }, [isAdmin]);

    return null;
}

function AppContent() {
    const { refreshAccessToken, isAuthenticated } = useAuth();

    useEffect(() => {
        // Initialize API client with auth callbacks
        initializeApiClient({
            getToken: () => localStorage.getItem('accessToken'),
            refreshToken: refreshAccessToken,
        });
    }, [refreshAccessToken]);

    // SSE real-time sync — active for all authenticated users
    useSSE(isAuthenticated);

    return (
        <Router>
            <PwaLoader />
            <ImpersonationExitButton />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<UserProfilePage />} />

                {/* Auth routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/signup" element={<SignupPage />} />
                <Route path="/auth/request-reset" element={<RequestResetPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/set-password" element={<SetPasswordPage />} />

                {/* Admin routes (protected) */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute
                            requireAnyPermission={[
                                'user_management:read', 'user_management:create', 'user_management:update', 'user_management:delete',
                                'users:read', 'users:create', 'users:update', 'users:delete',
                                'roles:read', 'roles:create', 'roles:update', 'roles:delete',
                                'permissions:read', 'permissions:create', 'permissions:update', 'permissions:delete'
                            ]}
                        >
                            <UsersManagementPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/games/talkies"
                    element={
                        <ProtectedRoute
                            requireAnyPermission={[
                                'talkies:read', 'talkies:create', 'talkies:update', 'talkies:delete',
                                'heroes:read', 'heroes:create', 'heroes:update', 'heroes:delete',
                                'movies:read', 'movies:create', 'movies:update', 'movies:delete',
                                'cards:read', 'cards:create', 'cards:update', 'cards:delete',
                                'tags:read', 'tags:create', 'tags:update', 'tags:delete'
                            ]}
                        >
                            <TalkiesGamePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/games/talkies/hero/:heroId"
                    element={
                        <ProtectedRoute
                            requireAnyPermission={[
                                'talkies:read', 'heroes:read', 'movies:read', 'cards:read', 'tags:read'
                            ]}
                        >
                            <HeroDetailsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/games/talkies/hero/:heroId/movie/:movieId"
                    element={
                        <ProtectedRoute
                            requireAnyPermission={[
                                'talkies:read', 'movies:read', 'cards:read', 'tags:read'
                            ]}
                        >
                            <MovieDetailsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/notifications"
                    element={
                        <ProtectedRoute>
                            <NotificationHistoryPage />
                        </ProtectedRoute>
                    }
                />

                {/* Game routes */}
                <Route path="/games/play-cards" element={<PlayCardsPage />} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <AppContent />
                    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                </AuthProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;
