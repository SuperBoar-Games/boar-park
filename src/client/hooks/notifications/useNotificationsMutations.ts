import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

export function useReadAllMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiClient.post('/api/notifications/read-all', {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
}

export function useSubscribeMutation() {
    return useMutation({
        mutationFn: (subscription: PushSubscriptionJSON) =>
            apiClient.post('/api/notifications/subscribe', subscription),
    });
}

export function useUnsubscribeMutation() {
    return useMutation({
        mutationFn: (endpoint: string) =>
            apiClient.post('/api/notifications/unsubscribe', { endpoint }),
    });
}
