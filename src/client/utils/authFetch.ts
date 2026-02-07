/**
 * Authenticated fetch wrapper with automatic token refresh on 401/403
 */

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export async function authFetch(
    endpoint: string,
    options: RequestInit = {},
    getToken: () => string | null,
    onTokenRefresh: (newToken: string) => void
): Promise<Response> {
    const token = getToken();

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
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                // Try to refresh the token
                const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    const newAccessToken = refreshData.data.accessToken;

                    // Update stored token and notify parent
                    localStorage.setItem('accessToken', newAccessToken);
                    onTokenRefresh(newAccessToken);

                    // Retry the original request with new token
                    const retryHeaders = {
                        ...options.headers,
                        'Authorization': `Bearer ${newAccessToken}`,
                    };

                    response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        ...options,
                        headers: retryHeaders,
                    });
                } else {
                    // Refresh failed, clear tokens
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }
    }

    return response;
}
