import { supabase } from "@/lib/supabase";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure default notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications and return the Expo push token.
 * Saves the token to the user's profile in Supabase.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
        console.log("Push notifications require a physical device.");
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Push notification permission not granted.");
        return null;
    }

    // Android notification channel
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "KURS Notifications",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#10B981",
        });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to user metadata (no extra DB column needed)
    await supabase.auth.updateUser({
        data: { push_token: token },
    });

    return token;
}

/** Types for notification payload within the app */
export type KursNotificationType = "pickup_assigned" | "pickup_en_route" | "pickup_completed" | "deposit_verified" | "new_job";

export interface KursNotificationData {
    type: KursNotificationType;
    title: string;
    body: string;
    /** Related entity ID (pickup_id, deposit_id, etc.) */
    entityId?: string;
}

/**
 * Schedule a local notification (useful for testing or offline scenarios).
 */
export async function scheduleLocalNotification(data: KursNotificationData): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: data.title,
            body: data.body,
            data: { type: data.type, entityId: data.entityId },
        },
        trigger: null, // immediate
    });
}
