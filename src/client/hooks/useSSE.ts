// Server-Sent Events hook for real-time UI updates
// Uses fetch() instead of EventSource to avoid QUIC/HTTP3 protocol errors through Cloudflare.
// EventSource doesn't support custom reconnect behavior — fetch-based SSE gives us
// exponential backoff so errors don't pile up when the connection drops.

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

// Exponential backoff: 2s, 4s, 8s, 16s, 30s (cap)
function nextDelay(attempt: number): number {
    return Math.min(2000 * Math.pow(2, attempt), 30000);
}

export function useSSE(isAuthenticated: boolean) {
    const queryClient = useQueryClient();
    const abortRef = useRef<AbortController | null>(null);
    const attemptRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        let stopped = false;

        async function connect() {
            if (stopped) return;

            // Cancel any previous connection
            abortRef.current?.abort();
            const ac = new AbortController();
            abortRef.current = ac;

            const token = localStorage.getItem('accessToken');
            const url = `${API_BASE_URL}/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;

            try {
                const res = await fetch(url, {
                    signal: ac.signal,
                    headers: { Accept: 'text/event-stream' },
                    // Keep-alive so the TCP connection isn't reused for QUIC upgrade
                    cache: 'no-store',
                });

                if (!res.ok || !res.body) {
                    throw new Error(`SSE HTTP ${res.status}`);
                }

                // Successful connection — reset backoff
                attemptRef.current = 0;

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                // Parse SSE stream manually
                while (true) {
                    const { done, value } = await reader.read();
                    if (done || stopped) break;

                    buffer += decoder.decode(value, { stream: true });

                    // SSE messages are separated by double newlines
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() ?? '';

                    for (const part of parts) {
                        if (!part.trim()) continue;

                        let eventName = 'message';
                        let data = '';

                        for (const line of part.split('\n')) {
                            if (line.startsWith('event:')) {
                                eventName = line.slice(6).trim();
                            } else if (line.startsWith('data:')) {
                                data = line.slice(5).trim();
                            }
                            // Ignore: id:, retry:, comments (:)
                        }

                        dispatchEvent(eventName, data, queryClient);
                    }
                }

                // Clean stream end (server restart/deploy closes the response
                // without an error) — reconnect, or realtime dies silently.
                if (!stopped) {
                    const delay = nextDelay(attemptRef.current);
                    attemptRef.current = Math.min(attemptRef.current + 1, 5);
                    timerRef.current = setTimeout(() => { if (!stopped) connect(); }, delay);
                }
            } catch (err) {
                if (stopped) return;
                // AbortError = intentional teardown, don't reconnect
                if (err instanceof DOMException && err.name === 'AbortError') return;

                // Network/QUIC error — reconnect with backoff
                const delay = nextDelay(attemptRef.current);
                attemptRef.current = Math.min(attemptRef.current + 1, 5);
                timerRef.current = setTimeout(() => { if (!stopped) connect(); }, delay);
            }
        }

        connect();

        return () => {
            stopped = true;
            abortRef.current?.abort();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isAuthenticated, queryClient]);
}

function dispatchEvent(eventName: string, data: string, queryClient: ReturnType<typeof useQueryClient>) {
    switch (eventName) {
        case 'talkies:heroes':
            queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
            break;

        case 'talkies:movies': {
            try {
                const { heroId } = JSON.parse(data);
                if (heroId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(heroId) });
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
                }
            } catch { /* ignore parse errors */ }
            break;
        }

        case 'talkies:cards': {
            try {
                const { heroId, movieId } = JSON.parse(data);
                if (heroId && movieId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.cards(heroId, movieId) });
                } else if (heroId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.talkies.cards(heroId) });
                }
            } catch { /* ignore */ }
            break;
        }

        case 'talkies:tags':
            queryClient.invalidateQueries({ queryKey: queryKeys.talkies.tags.all() });
            break;

        case 'admin:users':
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
            break;

        case 'files:cards': {
            try {
                const { cardId } = JSON.parse(data);
                if (cardId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.files.card(cardId) });
                }
            } catch { /* ignore */ }
            break;
        }
    }
}
