// Web Push notification utility

import webpush from "web-push";
import { sql } from "bun";
import {
    GET_ALL_PUSH_SUBSCRIPTIONS_QUERY,
    DELETE_PUSH_SUBSCRIPTION_QUERY,
    INSERT_NOTIFICATIONS_FOR_ALL_USERS_QUERY,
} from "../queries/notifications.queries";

const vapidPublicKey = Bun.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = Bun.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = Bun.env.VAPID_SUBJECT || "mailto:admin@superboar.com";

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
    if (!vapidPublicKey || !vapidPrivateKey) {
        return;
    }

    try {
        // Insert notification rows for all active users
        await sql.unsafe(INSERT_NOTIFICATIONS_FOR_ALL_USERS_QUERY, [
            payload.title,
            payload.body,
            payload.url || "/admin",
        ]);
    } catch (error) {
        console.error("[push] Failed to insert notification rows:", error);
    }

    // Send browser push to all subscriptions
    let subscriptions: any[] = [];
    try {
        subscriptions = await sql.unsafe(GET_ALL_PUSH_SUBSCRIPTIONS_QUERY);
    } catch (error) {
        console.error("[push] Failed to fetch push subscriptions:", error);
        return;
    }

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                },
                JSON.stringify(payload)
            );
        } catch (error: any) {
            // 410 Gone or 404 Not Found = subscription expired, remove it
            if (error?.statusCode === 410 || error?.statusCode === 404) {
                try {
                    await sql.unsafe(DELETE_PUSH_SUBSCRIPTION_QUERY, [sub.id]);
                } catch {
                    // ignore cleanup errors
                }
            } else {
                console.error(`[push] Failed to send to ${sub.endpoint}:`, error?.message);
            }
        }
    }
}

export function getVapidPublicKey(): string {
    return vapidPublicKey;
}
