import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

export interface Notification {
    id: number;
    title: string;
    body: string;
    url: string | null;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    return useQuery({
        queryKey: queryKeys.notifications.unread(),
        queryFn: async (): Promise<Notification[]> => {
            const res = await apiClient.get<{ success: boolean; data: Notification[] }>('/api/notifications');
            return res.data ?? [];
        },
        staleTime: 1000 * 60, // 1 min — SSE will trigger invalidation anyway
    });
}

export function useVapidKey() {
    return useQuery({
        queryKey: ['notifications', 'vapid-key'],
        queryFn: async (): Promise<string | null> => {
            try {
                const res = await apiClient.get<{ success: boolean; data: { vapidPublicKey: string } }>('/api/notifications/vapid-key');
                return res.data?.vapidPublicKey ?? null;
            } catch {
                return null;
            }
        },
        staleTime: Infinity, // VAPID key never changes
    });
}
