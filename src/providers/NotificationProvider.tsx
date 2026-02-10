import { useAuth } from "@/providers/AuthProvider";
import type { KursNotificationType } from "@/utils/notifications";
import { registerForPushNotifications } from "@/utils/notifications";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";

/**
 * Wraps the app tree to handle:
 * 1. Push token registration on login
 * 2. Foreground notification responses (tap → navigate)
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    // Register push token when user is authenticated
    useEffect(() => {
        if (user?.id) {
            registerForPushNotifications(user.id).catch(console.error);
        }
    }, [user?.id]);

    // Listen for notification taps
    useEffect(() => {
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
