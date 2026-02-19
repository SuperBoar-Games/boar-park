// Server-Sent Events hook for real-time UI updates
// Listens for change events from the server and invalidates relevant React Query caches

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export function useSSE(isAuthenticated: boolean) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isAuthenticated) return;

        // EventSource doesn't support custom headers for auth.
        // The server authenticates via Bearer token in query param or cookie.
        // Since our auth is JWT in localStorage, we use a short-lived token approach:
        // pass the access token as a query param for the SSE connection.
        const token = localStorage.getItem('accessToken');
        const url = `${API_BASE_URL}/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const es = new EventSource(url);

        es.addEventListener('talkies:heroes', () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
        });

        es.addEventListener('talkies:movies', (e: MessageEvent) => {
            try {
                const { heroId } = JSON.parse(e.data);
                if (heroId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(heroId) });
                    // Also refresh hero stats (total_movies count)
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
                }
            } catch { /* ignore parse errors */ }
        });

        es.addEventListener('talkies:cards', (e: MessageEvent) => {
            try {
                const { heroId, movieId } = JSON.parse(e.data);
                if (heroId && movieId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.cards(heroId, movieId) });
                } else if (heroId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.cards(heroId) });
                }
            } catch { /* ignore */ }
        });

        es.addEventListener('talkies:tags', () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.talkies.tags.all() });
        });

        es.addEventListener('admin:users', () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
        });

        // EventSource auto-reconnects on error — no action needed
        es.onerror = () => {};

        return () => {
            es.close();
        };
    }, [isAuthenticated, queryClient]);
}
