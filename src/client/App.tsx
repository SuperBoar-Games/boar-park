// Main application component with routing for all pages and layouts

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PlayCardsPage from './pages/games/PlayCardsPage';
import TalkiesGamePage from './pages/admin/talkies/TalkiesGamePage';
import HeroDetailsPage from './pages/admin/talkies/HeroDetailsPage';
import MovieDetailsPage from './pages/admin/talkies/MovieDetailsPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import RequestResetPage from './pages/auth/RequestResetPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SetPasswordPage from './pages/auth/SetPasswordPage';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
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
                                <ProtectedRoute requireAdmin>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute requireAdmin>
                                    <UsersManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/games/talkies"
                            element={
                                <ProtectedRoute requireAdmin>
                                    <TalkiesGamePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/games/talkies/hero/:heroId"
                            element={
                                <ProtectedRoute requireAdmin>
                                    <HeroDetailsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/games/talkies/movie/:movieId"
                            element={
                                <ProtectedRoute requireAdmin>
                                    <MovieDetailsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Game routes */}
                        <Route path="/games/play-cards" element={<PlayCardsPage />} />

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
