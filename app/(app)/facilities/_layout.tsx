import { COLORS } from "@/utils/constants";
import { Stack } from "expo-router";

export default function FacilitiesLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.surface },
                headerTintColor: COLORS.text,
                headerTitleStyle: { fontWeight: "600" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="map"
                options={{
                    title: "Cari Fasilitas",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: "Detail Fasilitas",
                    headerBackTitle: "Kembali",
                }}
            />
        </Stack>
    );
}
