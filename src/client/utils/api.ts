// API base URL - uses backend server in dev, same origin in production
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export async function apiRequest<T = any>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    get: <T = any>(endpoint: string) => apiRequest<T>(endpoint),
    post: <T = any>(endpoint: string, data: any) =>
        apiRequest<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    put: <T = any>(endpoint: string, data: any) =>
        apiRequest<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    patch: <T = any>(endpoint: string, data: any) =>
        apiRequest<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
    delete: <T = any>(endpoint: string) =>
        apiRequest<T>(endpoint, { method: 'DELETE' }),
};
