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
    // OR if we are strict about "desiredRole", check that too.
    // For now, let's just check if they HAVE the role.
    // If they switched to 'user' mode, they shouldn't be here?
    // Yes, if desiredRole is 'user', they should be in /(app).

    if (!profile || (profile.role !== "collector" && profile.role !== "operator" && profile.role !== "admin")) {
        // If they are not a collector (or higher), kick them out.
        // Note: 'admin' might want to see this view for testing.
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
            <Stack.Screen name="dashboard" />
        </Stack>
    );
}
