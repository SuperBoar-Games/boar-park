// Authentication context for managing user login state, tokens, and role-based access

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

interface UserRole {
    gameId: number | null;
    gameName: string | null;
    roleId: number;
    roleName: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    status: string;
    roles: UserRole[];
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
    signup: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    isAdmin: () => boolean;
    hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load tokens and user from localStorage on mount
    useEffect(() => {
        const loadAuth = async () => {
            const storedAccessToken = localStorage.getItem('accessToken');
            const storedRefreshToken = localStorage.getItem('refreshToken');

            if (storedAccessToken && storedRefreshToken) {
                setAccessToken(storedAccessToken);
                // Try to fetch current user
                try {
                    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedAccessToken}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.data);
                    } else if (response.status === 401) {
                        // Token expired, try to refresh
                        const refreshed = await refreshAccessToken();
                        if (!refreshed) {
                            // Refresh failed, clear tokens
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            setAccessToken(null);
                        }
                        // refreshAccessToken already fetches user data, so we're done
                    }
                } catch (error) {
                    console.error('Failed to load user:', error);
                }
            }

            setIsLoading(false);
        };

        loadAuth();

        // Set up automatic token refresh every 1.5 hours (halfway through 2h token life)
        const refreshInterval = setInterval(async () => {
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (storedRefreshToken) {
                await refreshAccessToken();
            }
        }, 90 * 60 * 1000); // 90 minutes

        return () => clearInterval(refreshInterval);
    }, []);

    const login = async (usernameOrEmail: string, password: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUser(data.data.user);
                setAccessToken(data.data.accessToken);
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error' };
        }
    };

    const signup = async (username: string, email: string, password: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'Signup failed' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'Network error' };
        }
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const refreshAccessToken = async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                setAccessToken(data.data.accessToken);
                localStorage.setItem('accessToken', data.data.accessToken);

                // Fetch updated user data
                const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${data.data.accessToken}`,
                    },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUser(userData.data);
                }

                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Refresh token error:', error);
            return false;
        }
    };

    const isAdmin = () => {
        if (!user || !user.roles) return false;
        return user.roles.some(role => role.roleName === 'admin');
    };

    const hasRole = (roleName: string) => {
        if (!user || !user.roles) return false;
        return user.roles.some(role => role.roleName === roleName);
    };

    const value: AuthContextType = {
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshAccessToken,
        isAdmin,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
