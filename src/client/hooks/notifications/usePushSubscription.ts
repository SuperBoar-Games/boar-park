// Hook to request notification permission and subscribe to push notifications

import { useEffect, useRef } from 'react';
import { useSubscribeMutation } from './useNotificationsMutations';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushSubscription(isAuthenticated: boolean) {
    const { mutate: subscribe } = useSubscribeMutation();
    const attempted = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (attempted.current) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        attempted.current = true;

        async function setupPush() {
            try {
                // Fetch VAPID key (no auth needed)
                const res = await fetch(`${API_BASE_URL}/api/notifications/vapid-key`);
                if (!res.ok) return;
                const json = await res.json();
                const vapidPublicKey: string = json?.data?.vapidPublicKey;
                if (!vapidPublicKey) return;

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const registration = await navigator.serviceWorker.ready;
                const existing = await registration.pushManager.getSubscription();
                if (existing) {
                    // Check if existing subscription uses the same VAPID key
                    const existingKey = existing.options?.applicationServerKey;
                    const newKey = urlBase64ToUint8Array(vapidPublicKey);
                    const existingKeyBase64 = existingKey
                        ? btoa(String.fromCharCode(...new Uint8Array(existingKey as ArrayBuffer)))
                        : null;
                    const newKeyBase64 = btoa(String.fromCharCode(...newKey));

                    if (existingKeyBase64 === newKeyBase64) {
                        // Same key — re-send to keep DB in sync
                        subscribe(existing.toJSON() as PushSubscriptionJSON);
                        return;
                    }
                    // Different key — unsubscribe stale subscription first
                    await existing.unsubscribe();
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });

                subscribe(subscription.toJSON() as PushSubscriptionJSON);
            } catch {
                // Push subscription is best-effort — silently ignore failures
                // (common on networks that block FCM or browsers without push support)
            }
        }

        setupPush();
    }, [isAuthenticated]);
}
