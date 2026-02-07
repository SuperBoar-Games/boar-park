// Hook for authenticated API requests with automatic token refresh on 401/403

import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export function useAuthFetch() {
    const { accessToken, refreshAccessToken } = useAuth();

    const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
        const token = accessToken;

        const headers = {
            ...options.headers,
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };

        let response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // If we get 401/403, try to refresh token and retry once
        if ((response.status === 401 || response.status === 403) && token) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                // Get fresh token after refresh
                const freshToken = localStorage.getItem('accessToken');
                const retryHeaders = {
                    ...options.headers,
                    ...(freshToken && { 'Authorization': `Bearer ${freshToken}` }),
                };

                response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: retryHeaders,
                });
            }
        }

        return response;
    };

    return authFetch;
}
