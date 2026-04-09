/**
 * Mock implementation of notifications for web to avoid Metro bundling errors.
 */
export function initNotificationHandler(): void {
    // No-op on web
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
    console.log("Push notifications are not supported on Web.");
    return null;
}

export type KursNotificationType = "pickup_assigned" | "pickup_en_route" | "pickup_completed" | "deposit_verified" | "new_job";

export interface KursNotificationData {
    type: KursNotificationType;
    title: string;
    body: string;
    entityId?: string;
}

export async function scheduleLocalNotification(data: KursNotificationData): Promise<void> {
    // No-op on web
}

export async function getBadgeCount(): Promise<number> {
    return 0;
}
