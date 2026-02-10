import { Stack } from "expo-router";

export default function AppLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="pickup/request"
                options={{
                    presentation: "modal",
                    headerShown: true,
                    headerTitle: "Permintaan Pickup",
                }}
            />
            <Stack.Screen
                name="pickup/[id]"
                options={{
                    headerShown: true,
                    headerTitle: "Status Pickup",
                }}
            />
            <Stack.Screen
                name="deposit/qr"
                options={{
                    presentation: "modal",
                    headerShown: true,
                    headerTitle: "QR Deposit",
                }}
            />
        </Stack>
    );
}
