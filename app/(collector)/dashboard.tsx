import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectorDashboard() {
    const { switchRole, profile } = useAuth();
    const router = useRouter();

    const handleSwitchToUser = () => {
        switchRole("user");
        router.replace("/(tabs)/home" as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ padding: 24 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "GoogleSans-Bold" }}>Halo, Mitra!</Text>
                        <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: "GoogleSans-Regular" }}>{profile?.full_name}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSwitchToUser}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: COLORS.surface,
                            padding: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                        }}
                    >
                        <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                        <Text style={{ marginLeft: 8, color: COLORS.primary, fontWeight: "600", fontFamily: "GoogleSans-Medium" }}>Mode User</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
                    <Text style={{ textAlign: "center", color: COLORS.textSecondary, fontFamily: "GoogleSans-Regular" }}>Dashboard Mitra akan tersedia di sini.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
