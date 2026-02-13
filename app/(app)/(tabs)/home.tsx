import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    const router = useRouter();
    const { profile } = useAuth();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>Selamat datang,</Text>
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            color: COLORS.text,
                            marginTop: 4,
                        }}
                    >
                        {profile?.full_name || "Pengguna"}
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={{ gap: 16 }}>
                    {/* Main CTA - Request Pickup */}
                    <TouchableOpacity
                        onPress={() => router.push("/(app)/pickup/request")}
                        style={{
                            backgroundColor: COLORS.primary,
                            padding: 24,
                            borderRadius: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <View>
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: "bold",
                                    color: "white",
                                }}
                            >
                                Minta Pickup
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "rgba(255,255,255,0.8)",
                                    marginTop: 4,
                                }}
                            >
                                Jadwalkan pengambilan sampah
                            </Text>
                        </View>
                        <View
                            style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                padding: 12,
                                borderRadius: 12,
                            }}
                        >
                            <Ionicons name="car" size={28} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* Secondary Actions Row */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {/* Deposit to Waste Bank */}
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/deposit/qr")}
                            style={{
                                flex: 1,
                                backgroundColor: COLORS.surface,
                                padding: 20,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: COLORS.secondary + "20",
                                    padding: 12,
                                    borderRadius: 12,
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons name="qr-code" size={24} color={COLORS.secondary} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: COLORS.text,
                                    textAlign: "center",
                                }}
                            >
                                Deposit ke Bank Sampah
                            </Text>
                        </TouchableOpacity>

                        {/* Find Facilities */}
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/facilities/map")}
                            style={{
                                flex: 1,
                                backgroundColor: COLORS.surface,
                                padding: 20,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: COLORS.warning + "20",
                                    padding: 12,
                                    borderRadius: 12,
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons name="map" size={24} color={COLORS.warning} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: COLORS.text,
                                    textAlign: "center",
                                }}
                            >
                                Cari TPS / Bank Sampah
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Active Pickup Banner (placeholder) */}
                <View
                    style={{
                        marginTop: 24,
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: COLORS.text,
                            marginBottom: 8,
                        }}
                    >
                        Pickup Aktif
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Belum ada pickup yang sedang berjalan</Text>
                </View>

                {/* Stats Cards */}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.surface,
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.primary }}>0</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Total Pickup</Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.surface,
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.secondary }}>0</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Total Deposit</Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.surface,
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.success }}>0 kg</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Sampah Terkelola</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
