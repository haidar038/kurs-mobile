import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/** Returns true when running inside Expo Go (where push is unsupported since SDK 53). */
function isExpoGo(): boolean {
    return Constants.appOwnership === "expo";
}

/**
 * Call this once (e.g. from NotificationProvider) to set the default
 * notification handler. Skipped automatically inside Expo Go.
 */
export function initNotificationHandler(): void {
    if (isExpoGo()) return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

/**
 * Register for push notifications and return the Expo push token.
 * Saves the token to the user's profile in Supabase.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    if (isExpoGo()) {
        console.log("Push notifications are not supported in Expo Go (SDK 53+). Use a development build.");
        return null;
    }

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

    // Resolve projectId from app config (required in bare / dev-build workflows)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId ?? undefined,
    });
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
    if (isExpoGo()) return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: data.title,
            body: data.body,
            data: { type: data.type, entityId: data.entityId },
        },
        trigger: null, // immediate
    });
}
