import { useAuth } from "@/providers/AuthProvider";
import type { KursNotificationType } from "@/utils/notifications";
import { initNotificationHandler, registerForPushNotifications } from "@/utils/notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Wraps the app tree to handle:
 * 1. Push token registration on login
 * 2. Foreground notification responses (tap → navigate)
 *
 * All functionality is disabled inside Expo Go (SDK 53+) to avoid crashes.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const responseListener = useRef<Notifications.EventSubscription | null>(null);
    const isRegistering = useRef(false);

    // Initialise notification handler once (no-op in Expo Go)
    useEffect(() => {
        initNotificationHandler();
    }, []);

    // Register push token when user is authenticated
    useEffect(() => {
        const register = async () => {
            if (user?.id && !isRegistering.current) {
                isRegistering.current = true;
                try {
                    await registerForPushNotifications(user.id);
                } catch (err) {
                    console.error("Error in NotificationProvider registration:", err);
                } finally {
                    isRegistering.current = false;
                }
            }
        };

        register();
    }, [user?.id]);

    // Listen for notification taps (skip in Expo Go)
    useEffect(() => {
        if (isExpoGo) return;

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as {
                type?: KursNotificationType;
                entityId?: string;
            };

            if (!data?.type) return;

            switch (data.type) {
                case "pickup_assigned":
                case "pickup_en_route":
                case "pickup_completed":
                    if (data.entityId) {
                        router.push(`/(app)/pickup/${data.entityId}` as never);
                    }
                    break;
                case "new_job":
                    router.push("/(collector)/jobs" as never);
                    break;
                case "deposit_verified":
                    router.push("/(app)/(tabs)/history" as never);
                    break;
            }
        });

        return () => {
            responseListener.current?.remove();
        };
    }, [router]);

    return <>{children}</>;
}
