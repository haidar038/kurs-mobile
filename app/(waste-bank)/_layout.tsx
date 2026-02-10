import { Stack } from "expo-router";

export default function WasteBankLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: "#3B82F6" },
                headerTintColor: "white",
            }}
        >
            <Stack.Screen name="scan" options={{ headerTitle: "Scan QR Depositor" }} />
            <Stack.Screen name="deposit-form" options={{ headerTitle: "Form Deposit" }} />
        </Stack>
    );
}
