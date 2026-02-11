import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";

export default function CollectorEarningsScreen() {
    const { user } = useAuth();

    // Get collector record
    const { data: collector } = useQuery({
        queryKey: ["collector", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("collectors").select("*").eq("user_id", user!.id).single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    // Get completed pickups
    const {
        data: completedPickups,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["earnings", collector?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("collector_id", collector!.id).eq("status", "completed").order("updated_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!collector?.id,
    });

    const totalEarnings = completedPickups?.reduce((sum, p) => sum + (p.fee ?? 0), 0) || 0;
    const todayDate = new Date().toDateString();
    const todayEarnings = completedPickups?.filter((p) => new Date(p.updated_at ?? "").toDateString() === todayDate)?.reduce((sum, p) => sum + (p.fee ?? 0), 0) || 0;

    return (
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
            {/* Summary Cards */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.primary,
                        borderRadius: 16,
                        padding: 20,
                    }}
                >
                    <Ionicons name="today" size={24} color="white" />
                    <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 12 }}>Hari Ini</Text>
                    <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", marginTop: 4 }}>Rp {todayEarnings.toLocaleString("id-ID")}</Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: COLORS.success,
                        borderRadius: 16,
                        padding: 20,
                    }}
                >
                    <Ionicons name="wallet" size={24} color="white" />
                    <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 12 }}>Total</Text>
                    <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", marginTop: 4 }}>Rp {totalEarnings.toLocaleString("id-ID")}</Text>
                </View>
            </View>

            {/* Stats */}
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Statistik</Text>
                <View style={{ flexDirection: "row", marginTop: 16 }}>
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={{ fontSize: 28, fontWeight: "bold", color: COLORS.primary }}>{completedPickups?.length || 0}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Pickup Selesai</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={{ fontSize: 28, fontWeight: "bold", color: COLORS.secondary }}>{completedPickups?.filter((p) => new Date(p.updated_at ?? "").toDateString() === todayDate).length || 0}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Pickup Hari Ini</Text>
                    </View>
                </View>
            </View>

            {/* History */}
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 20,
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Riwayat Pendapatan</Text>
                {completedPickups && completedPickups.length > 0 ? (
                    completedPickups.slice(0, 10).map((pickup) => (
                        <View
                            key={pickup.id}
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border,
                            }}
                        >
                            <View>
                                <Text style={{ fontSize: 14, color: COLORS.text }}>{pickup.waste_types.join(", ")}</Text>
                                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{new Date(pickup.updated_at ?? "").toLocaleString("id-ID")}</Text>
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.success }}>+Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Belum ada riwayat pendapatan</Text>
                )}
            </View>
        </ScrollView>
    );
}
