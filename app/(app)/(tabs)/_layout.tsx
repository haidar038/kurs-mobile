import CustomTabBar from "@/components/ui/CustomTabBar";
import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Beranda",
                }}
            />
            <Tabs.Screen
                name="facilities"
                options={{
                    title: "Fasilitas",
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    title: "Scan AI",
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "Riwayat",
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                }}
            />
        </Tabs>
    );
}
