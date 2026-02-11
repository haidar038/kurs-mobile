import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { PickupRequest } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, Text, View } from "react-native";

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

    const renderJobCard = ({ item }: { item: PickupRequest }) => (
        <View
            style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{new Date(item.created_at ?? "").toLocaleString("id-ID")}</Text>
                <View
                    style={{
                        backgroundColor: item.status === "completed" ? COLORS.primary + "20" : COLORS.error + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 12,
                            color: item.status === "completed" ? COLORS.primary : COLORS.error,
                            textTransform: "capitalize",
                            fontWeight: "600",
                        }}
                    >
                        {item.status}
                    </Text>
                </View>
            </View>

            <Text
                style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: COLORS.text,
                    marginBottom: 8,
                }}
            >
                {item.address || "Alamat tidak tersedia"}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", gap: 4 }}>
                    {item.waste_types.map((type: string) => (
                        <Text key={type} style={{ fontSize: 12, color: COLORS.textSecondary, backgroundColor: COLORS.background, padding: 4, borderRadius: 4 }}>
                            {type}
                        </Text>
                    ))}
                </View>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.primary }}>Rp {(item.fee ?? 0).toLocaleString("id-ID")}</Text>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 16 }}>Riwayat Pekerjaan</Text>

            <FlatList
                data={historyJobs}
                keyExtractor={(item) => item.id}
                renderItem={renderJobCard}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", paddingTop: 40 }}>
                        <Ionicons name="time-outline" size={48} color={COLORS.textSecondary} />
                        <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12 }}>Belum ada riwayat pekerjaan</Text>
                    </View>
                }
            />
        </View>
    );
}
