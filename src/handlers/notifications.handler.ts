// Notifications API handlers for push subscriptions and in-app notification management

import { sql } from "bun";
import { jsonResponse } from "../utils";
import { getVapidPublicKey } from "../lib/push";
import {
    GET_UNREAD_NOTIFICATIONS_QUERY,
    GET_ALL_NOTIFICATIONS_QUERY,
    DELETE_OLD_READ_NOTIFICATIONS_QUERY,
    MARK_ALL_READ_QUERY,
    UPSERT_PUSH_SUBSCRIPTION_QUERY,
    DELETE_PUSH_SUBSCRIPTION_BY_ENDPOINT_QUERY,
} from "../queries/notifications.queries";

export async function getVapidKeyHandler(): Promise<Response> {
    const key = getVapidPublicKey();
    if (!key) {
        return jsonResponse({ success: false, data: null, message: "Push notifications not configured" }, 503);
    }
    return jsonResponse({ success: true, data: { vapidPublicKey: key }, message: "VAPID key" });
}

export async function getNotificationsHandler(userId: number): Promise<Response> {
    try {
        const notifications = await sql.unsafe(GET_UNREAD_NOTIFICATIONS_QUERY, [userId]);
        return jsonResponse({ success: true, data: notifications, message: "Notifications fetched" });
    } catch (error) {
        console.error("[notifications] Error fetching notifications:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch notifications" }, 500);
    }
}

export async function getAllNotificationsHandler(userId: number): Promise<Response> {
    try {
        // Clean up old read notifications (fire and forget)
        sql.unsafe(DELETE_OLD_READ_NOTIFICATIONS_QUERY, [userId]).catch(() => {});
        const notifications = await sql.unsafe(GET_ALL_NOTIFICATIONS_QUERY, [userId]);
        return jsonResponse({ success: true, data: notifications, message: "Notifications fetched" });
    } catch (error) {
        console.error("[notifications] Error fetching all notifications:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch notifications" }, 500);
    }
}

export async function subscribeHandler(userId: number, body: any): Promise<Response> {
    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return jsonResponse({ success: false, data: null, message: "Missing subscription fields" }, 400);
    }

    try {
        await sql.unsafe(UPSERT_PUSH_SUBSCRIPTION_QUERY, [userId, endpoint, keys.p256dh, keys.auth]);
        return jsonResponse({ success: true, data: null, message: "Subscribed to push notifications" });
    } catch (error) {
        console.error("[notifications] Error saving subscription:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to save subscription" }, 500);
    }
}

export async function unsubscribeHandler(userId: number, body: any): Promise<Response> {
    const { endpoint } = body;
    if (!endpoint) {
        return jsonResponse({ success: false, data: null, message: "Missing endpoint" }, 400);
    }

    try {
        await sql.unsafe(DELETE_PUSH_SUBSCRIPTION_BY_ENDPOINT_QUERY, [endpoint]);
        return jsonResponse({ success: true, data: null, message: "Unsubscribed from push notifications" });
    } catch (error) {
        console.error("[notifications] Error removing subscription:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to remove subscription" }, 500);
    }
}

export async function markAllReadHandler(userId: number): Promise<Response> {
    try {
        await sql.unsafe(MARK_ALL_READ_QUERY, [userId]);
        return jsonResponse({ success: true, data: null, message: "All notifications marked as read" });
    } catch (error) {
        console.error("[notifications] Error marking notifications read:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to mark notifications as read" }, 500);
    }
}
