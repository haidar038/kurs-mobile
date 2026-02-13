import "@/global.css";
import { useAuth } from "@/providers/AuthProvider";
import { Providers } from "@/providers/Providers";
import { COLORS } from "@/utils/constants";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function RootLayoutNav() {
    const { session, isLoading, profile, signOut } = useAuth();
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

                if (role === "admin") {
                    // Admin should not use the mobile app
                    alert("Akses Ditolak: Admin harap menggunakan dashboard web.");
                    signOut();
                    return;
                }

                if (role === "collector") {
                    router.replace("/(collector)/(tabs)/dashboard");
                } else if (role === "waste_bank_staff") {
                    router.replace("/(waste-bank)/(tabs)" as any);
                } else {
                    router.replace("/(app)/(tabs)/home");
                }
            }
        }
    }, [session, isLoading, segments, profile, router, signOut]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="dark" backgroundColor={COLORS.primary} translucent={false} />
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
