import "@/global.css";
import { useAuth } from "@/providers/AuthProvider";
import { Providers } from "@/providers/Providers";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function RootLayoutNav() {
    const { session, isLoading, profile } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!session) {
            // Not logged in, redirect to login
            if (!inAuthGroup) {
                router.replace("/(auth)/login");
            }
        } else {
            // Logged in, redirect based on role
            if (inAuthGroup) {
                // Redirect to appropriate home based on role
                const role = profile?.role ?? "user";
                if (role === "collector") {
                    router.replace("/(collector)/jobs");
                } else if (role === "waste_bank_staff") {
                    router.replace("/(waste-bank)/scan");
                } else {
                    router.replace("/(app)/(tabs)/home");
                }
            }
        }
    }, [session, isLoading, segments, profile]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="(collector)" />
                <Stack.Screen name="(waste-bank)" />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <Providers>
            <RootLayoutNav />
        </Providers>
    );
}
