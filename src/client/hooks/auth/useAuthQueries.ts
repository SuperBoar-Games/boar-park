// React Query hooks for auth-related data fetching

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

interface User {
    id: number;
    username: string;
    email: string;
    isVerified: boolean;
    status: string;
    roles: Array<{
        gameId: number | null;
        gameName: string | null;
        roleId: number;
        roleName: string;
    }>;
}

export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.auth.currentUser,
        queryFn: async (): Promise<User> => {
            const response = await apiClient.get<{ success: boolean; data: User }>('/api/auth/me');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
}
