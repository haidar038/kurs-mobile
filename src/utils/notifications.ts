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
    // Resolve projectId from app config (required in bare / dev-build workflows)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    try {
        console.log("Fetching Expo push token...");
        // Add a timeout to prevent infinite hanging if native module is stuck
        const tokenPromise = Notifications.getExpoPushTokenAsync({
            projectId: projectId ?? undefined,
        });

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Push token fetch timed out")), 5000)
        );

        const tokenData = await Promise.race([tokenPromise, timeoutPromise]) as Notifications.ExpoPushToken;
        const token = tokenData.data;
        console.log("Push token received:", token);

        // Check current token in Supabase to avoid redundant updates
        const { data: { user } } = await supabase.auth.getUser();
        const currentToken = user?.user_metadata?.push_token;

        if (currentToken === token) {
            console.log("Push token already up to date in Supabase.");
            return token;
        }

        console.log("Updating push token in Supabase...");
        // Save token to user metadata (no extra DB column needed)
        const { error: updateError } = await supabase.auth.updateUser({
            data: { push_token: token },
        });

        if (updateError) throw updateError;
        console.log("Push token successfully updated.");

        return token;
    } catch (error) {
        console.warn("Failed to get or save push token:", error);
        return null;
    }
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
