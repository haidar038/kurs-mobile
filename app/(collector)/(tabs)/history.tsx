import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { PickupRequest } from "@/types/database";
import { COLORS, WASTE_TYPES } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectorHistoryScreen() {
    const { user } = useAuth();

    const {
        data: historyJobs,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["collector-history", user?.id],
        queryFn: async () => {
            // First get collector ID
            const { data: collector } = await supabase.from("collectors").select("id").eq("user_id", user!.id).single();

            if (!collector) return [];

            const { data, error } = await supabase.from("pickup_requests").select("*").eq("collector_id", collector.id).in("status", ["completed", "cancelled"]).order("updated_at", { ascending: false });

            if (error) throw error;
            return data as PickupRequest[];
        },
        enabled: !!user?.id,
    });

    const renderJobCard = ({ item }: { item: PickupRequest }) => {
        const isCompleted = item.status === "completed";

        return (
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                }}
            >
                {/* Header: Date and Status */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>
                            {new Date(item.created_at ?? "").toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: isCompleted ? COLORS.success + "15" : COLORS.error + "15",
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12,
                                color: isCompleted ? COLORS.success : COLORS.error,
                                textTransform: "capitalize",
                                fontWeight: "bold",
                                fontFamily: "PublicSans-Bold",
                            }}
                        >
                            {isCompleted ? "Selesai" : "Dibatalkan"}
                        </Text>
                    </View>
                </View>

                {/* Address */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <View style={{ backgroundColor: COLORS.background, padding: 8, borderRadius: 10, alignSelf: "flex-start" }}>
                        <Ionicons name="location" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: COLORS.text,
                                fontFamily: "PublicSans-Medium",
                                lineHeight: 22,
                            }}
                            numberOfLines={2}
                        >
                            {item.address || "Alamat tidak tersedia"}
                        </Text>
                    </View>
                </View>

                {/* Footer: Waste Types and Fee */}
                <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 16 }} />

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                        <View style={{ flexDirection: "row", gap: -8 }}>
                            {item.waste_types.slice(0, 3).map((typeId, idx) => {
                                const wasteType = WASTE_TYPES.find((t) => t.id === typeId);
                                return (
                                    <View
                                        key={typeId}
                                        style={{
                                            backgroundColor: COLORS.surface,
                                            padding: 4,
                                            borderRadius: 10,
                                            borderWidth: 2,
                                            borderColor: COLORS.surface,
                                            zIndex: 3 - idx,
                                        }}
                                    >
                                        <Text style={{ fontSize: 14 }}>{wasteType?.icon || "♻️"}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }} numberOfLines={1}>
                            {item.waste_types.length} jenis sampah
                        </Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.primary, fontFamily: "PublicSans-Bold" }}>Rp {(item.fee ?? 0).toLocaleString("id-ID")}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ flex: 1, padding: 24 }}>
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Riwayat Pekerjaan</Text>
                    <Text style={{ fontSize: 15, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", marginTop: 4 }}>Daftar semua pekerjaan yang telah kamu selesaikan</Text>
                </View>

                <FlatList
                    data={historyJobs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJobCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
                            <View style={{ backgroundColor: COLORS.surface, padding: 30, borderRadius: 100, marginBottom: 20 }}>
                                <Ionicons name="document-text-outline" size={60} color={COLORS.textSecondary} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Belum ada riwayat</Text>
                            <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", marginTop: 8, textAlign: "center", paddingHorizontal: 40 }}>
                                Pekerjaan yang selesai atau dibatalkan akan muncul di sini.
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
