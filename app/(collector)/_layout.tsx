import { useAuth } from "@/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function CollectorLayout() {
    const { profile, isLoading, desiredRole } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Guard: Must be logged in and have collector role
    if (!profile || (profile.role !== "collector" && profile.role !== "operator" && profile.role !== "admin")) {
        return <Redirect href={"/(tabs)/home" as any} />;
    }

    if (desiredRole === "user") {
        return <Redirect href={"/(tabs)/home" as any} />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="job/[id]" options={{ headerShown: true, title: "Detail Pekerjaan" }} />
        </Stack>
    );
}
