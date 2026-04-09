import React from "react";

/**
 * Mock NotificationProvider for web to avoid expo-notifications issues.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
