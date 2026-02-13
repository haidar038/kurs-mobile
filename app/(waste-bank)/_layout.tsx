import { Stack } from "expo-router";

export default function WasteBankLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: "#3B82F6" },
                headerTintColor: "white",
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scan" options={{ headerTitle: "Scan QR Depositor", headerShown: true }} />
            <Stack.Screen name="deposit-form" options={{ headerTitle: "Form Deposit", headerShown: true }} />
        </Stack>
    );
}
