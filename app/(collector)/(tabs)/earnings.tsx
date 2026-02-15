import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { PickupRequest } from "@/types/database";
import { COLORS, WASTE_TYPES } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            return data as PickupRequest[];
        },
        enabled: !!collector?.id,
    });

    const totalEarnings = completedPickups?.reduce((sum, p) => sum + (p.fee ?? 0), 0) || 0;
    const todayDate = new Date().toDateString();
    const todayPickups = completedPickups?.filter((p) => new Date(p.updated_at ?? "").toDateString() === todayDate) || [];
    const todayEarnings = todayPickups.reduce((sum, p) => sum + (p.fee ?? 0), 0) || 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Pendapatan Saya</Text>
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", marginTop: 4 }}>Pantau hasil kerja kerasmu hari ini</Text>
                </View>

                {/* Summary Cards */}
                <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.primary,
                            borderRadius: 20,
                            padding: 20,
                            elevation: 4,
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                        }}
                    >
                        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", padding: 8, borderRadius: 12 }}>
                            <Ionicons name="today" size={20} color="white" />
                        </View>
                        <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 12, fontSize: 13, fontFamily: "PublicSans-Medium" }}>Hari Ini</Text>
                        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginTop: 4, fontFamily: "PublicSans-Bold" }}>Rp {todayEarnings.toLocaleString("id-ID")}</Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.success,
                            borderRadius: 20,
                            padding: 20,
                            elevation: 4,
                            shadowColor: COLORS.success,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                        }}
                    >
                        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", padding: 8, borderRadius: 12 }}>
                            <Ionicons name="wallet" size={20} color="white" />
                        </View>
                        <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 12, fontSize: 13, fontFamily: "PublicSans-Medium" }}>Total</Text>
                        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginTop: 4, fontFamily: "PublicSans-Bold" }}>Rp {totalEarnings.toLocaleString("id-ID")}</Text>
                    </View>
                </View>

                {/* Statistics Card */}
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 20,
                        padding: 24,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold", marginBottom: 20 }}>Statistik Pickup</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <View style={{ alignItems: "center", flex: 1 }}>
                            <View style={{ backgroundColor: COLORS.primary + "10", padding: 12, borderRadius: 50, marginBottom: 8 }}>
                                <Ionicons name="checkmark-done" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>{completedPickups?.length || 0}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>Total Selesai</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: COLORS.border, height: "100%" }} />
                        <View style={{ alignItems: "center", flex: 1 }}>
                            <View style={{ backgroundColor: COLORS.secondary + "10", padding: 12, borderRadius: 50, marginBottom: 8 }}>
                                <Ionicons name="calendar" size={24} color={COLORS.secondary} />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>{todayPickups.length}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>Hari Ini</Text>
                        </View>
                    </View>
                </View>

                {/* Recent History Section */}
                <View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 16, fontFamily: "PublicSans-Bold" }}>Riwayat Pendapatan</Text>
                    {completedPickups && completedPickups.length > 0 ? (
                        <View style={{ backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" }}>
                            {completedPickups.slice(0, 20).map((pickup, index) => (
                                <View
                                    key={pickup.id}
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 16,
                                        borderBottomWidth: index === completedPickups.length - 1 ? 0 : 1,
                                        borderBottomColor: COLORS.border,
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                            {pickup.waste_types.slice(0, 3).map((typeId) => {
                                                const wasteType = WASTE_TYPES.find((t) => t.id === typeId);
                                                return (
                                                    <Text key={typeId} style={{ fontSize: 14 }}>
                                                        {wasteType?.icon || "♻️"}
                                                    </Text>
                                                );
                                            })}
                                            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text, fontFamily: "PublicSans-Medium" }} numberOfLines={1}>
                                                {pickup.waste_types.map((tid) => WASTE_TYPES.find((t) => t.id === tid)?.label).join(", ")}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>
                                            {new Date(pickup.updated_at ?? "").toLocaleString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.success, fontFamily: "PublicSans-Bold" }}>+Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={{ alignItems: "center", padding: 40, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border }}>
                            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontFamily: "PublicSans-Regular" }}>Belum ada riwayat pendapatan</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
