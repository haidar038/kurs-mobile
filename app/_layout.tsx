import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";
import "@/components/ui/CustomTouchableOpacity"; // Global TouchableOpacity activeOpacity
import "@/global.css";
import { useAuth } from "@/providers/AuthProvider";
import { Providers } from "@/providers/Providers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_SHOWN_KEY = "@splash_shown";

function RootLayoutNav() {
    const { session, isLoading, profile, signOut, hasRole } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!session) {
            // Not logged in, redirect to welcome (role selection)
            if (!inAuthGroup) {
                router.replace("/(auth)/welcome");
            }
        } else {
            // 1. Admin Guard
            if (hasRole("admin")) {
                Alert.alert("Akses Ditolak", "Admin harap menggunakan dashboard web.");
                signOut();
                return;
            }

            // 2. Route Protection
            const isCollectorGroup = segments[0] === "(collector)";
            const isStaffGroup = segments[0] === "(waste-bank)";

            if (isCollectorGroup && !hasRole("collector")) {
                router.replace("/(auth)/welcome");
                return;
            }
            if (isStaffGroup && !hasRole("waste_bank_staff")) {
                router.replace("/(auth)/welcome");
                return;
            }

            // 3. Initial Redirection (Only if in auth group)
            if (inAuthGroup) {
                if (hasRole("waste_bank_staff")) {
                    router.replace("/(waste-bank)/(tabs)" as any);
                } else if (hasRole("collector")) {
                    router.replace("/(collector)/(tabs)/dashboard");
                } else {
                    router.replace("/(app)/(tabs)/home");
                }
            }
        }
    }, [session, isLoading, segments, profile, router, signOut, hasRole]);

    // Determine if we are still "Loading" for the purpose of redirection
    // We are loading if:
    // 1. AuthProvider is still initializing (isLoading)
    // 2. We have a session but haven't fetched the profile roles yet
    const isActuallyLoading = isLoading || (!!session && !profile);

    if (isActuallyLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="dark" />
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
    const [isSplashComplete, setIsSplashComplete] = useState(false);
    const [isCheckingSplash, setIsCheckingSplash] = useState(true);

    useEffect(() => {
        checkSplashStatus();
    }, []);

    const checkSplashStatus = async () => {
        try {
            const hasShownSplash = await AsyncStorage.getItem(SPLASH_SHOWN_KEY);
            if (hasShownSplash === "true") {
                // Splash sudah pernah ditampilkan, skip
                setIsSplashComplete(true);
            }
        } catch (error) {
            console.error("Error checking splash status:", error);
        } finally {
            setIsCheckingSplash(false);
        }
    };

    const handleSplashFinish = async () => {
        try {
            await AsyncStorage.setItem(SPLASH_SHOWN_KEY, "true");
            setIsSplashComplete(true);
        } catch (error) {
            console.error("Error saving splash status:", error);
            setIsSplashComplete(true);
        }
    };

    // Show loading while checking splash status
    if (isCheckingSplash) {
        return null; // or a simple loading indicator
    }

    return (
        <Providers>
            {!isSplashComplete && <AnimatedSplashScreen onAnimationFinish={handleSplashFinish} />}
            <RootLayoutNav />
        </Providers>
    );
}
