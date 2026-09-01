// React Query mutations for auth operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

interface UpdateProfileParams {
  username: string;
  email: string;
  currentPassword: string;
  newPassword?: string;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileParams>({
    mutationFn: async (data) => {
      // apiClient.put already returns parsed JSON
      return await apiClient.put<UpdateProfileResponse>('/api/auth/me', data);
    },
    onSuccess: () => {
      // Invalidate current user query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
    },
  });
}
