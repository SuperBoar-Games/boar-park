// Unified authenticated API client with automatic token refresh

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

interface ApiClientOptions {
  getToken: () => string | null;
  refreshToken: () => Promise<boolean>;
}

let clientOptions: ApiClientOptions | null = null;

// Initialize with auth callbacks from AuthContext
export function initializeApiClient(options: ApiClientOptions) {
  clientOptions = options;
}

async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!clientOptions) {
    throw new Error('API client not initialized. Call initializeApiClient first.');
  }

  let token = clientOptions.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401/403 with token refresh
  if ((response.status === 401 || response.status === 403) && token) {
    const refreshed = await clientOptions.refreshToken();

    if (refreshed) {
      token = clientOptions.getToken();
      const retryHeaders = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) {
    const error = new Error(`API Error: ${response.statusText}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export const apiClient = {
  get: <T = any>(endpoint: string) => authRequest<T>(endpoint),
  post: <T = any>(endpoint: string, data: any) =>
    authRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T = any>(endpoint: string, data: any) =>
    authRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: <T = any>(endpoint: string, data: any) =>
    authRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T = any>(endpoint: string) =>
    authRequest<T>(endpoint, { method: 'DELETE' }),
};
