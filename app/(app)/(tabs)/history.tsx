import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Deposit, PickupRequest } from "@/types/database";
import { COLORS, PICKUP_STATUS_LABELS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HistoryItem = {
    id: string;
    type: "pickup" | "deposit";
    status: string;
    date: string;
    details: string;
};

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const {
        data: pickups,
        isLoading: loadingPickups,
        refetch: refetchPickups,
    } = useQuery({
        queryKey: ["pickups", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
            if (error) throw error;
            return data as PickupRequest[];
        },
        enabled: !!user?.id,
    });

    const {
        data: deposits,
        isLoading: loadingDeposits,
        refetch: refetchDeposits,
    } = useQuery({
        queryKey: ["deposits", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("deposits").select("*").eq("depositor_id", user!.id).order("created_at", { ascending: false });
            if (error) throw error;
            return data as Deposit[];
        },
        enabled: !!user?.id,
    });

    const history: HistoryItem[] = [
        ...(pickups?.map((p) => ({
            id: p.id,
            type: "pickup" as const,
            status: p.status ?? "",
            date: p.created_at ?? "",
            details: p.waste_types.join(", "),
        })) || []),
        ...(deposits?.map((d) => ({
            id: d.id,
            type: "deposit" as const,
            status: d.status ?? "",
            date: d.created_at ?? "",
            details: `${d.waste_type} - ${d.weight || 0} kg`,
        })) || []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const isLoading = loadingPickups || loadingDeposits;

    const onRefresh = () => {
        refetchPickups();
        refetchDeposits();
    };

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity
            onPress={() => {
                if (item.type === "pickup") {
                    router.push(`/(app)/pickup/${item.id}`);
                }
            }}
            style={{
                backgroundColor: COLORS.surface,
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
            }}
        >
            <View
                style={{
                    backgroundColor: item.type === "pickup" ? COLORS.primary + "20" : COLORS.secondary + "20",
                    padding: 10,
                    borderRadius: 10,
                }}
            >
                <Ionicons name={item.type === "pickup" ? "car" : "cube"} size={20} color={item.type === "pickup" ? COLORS.primary : COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>{item.type === "pickup" ? "Pickup" : "Deposit"}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {item.details}
                </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text
                    style={{
                        fontSize: 12,
                        color: item.status === "completed" || item.status === "verified" ? COLORS.success : COLORS.warning,
                        fontWeight: "500",
                    }}
                >
                    {item.type === "pickup" ? PICKUP_STATUS_LABELS[item.status as keyof typeof PICKUP_STATUS_LABELS] : item.status}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{new Date(item.date).toLocaleDateString("id-ID")}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                {/* Header Container */}
                <View style={{ backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                    <View style={{ padding: 20, paddingBottom: 12 }}>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text }}>Riwayat</Text>
                    </View>
                </View>

                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60 }}>
                            <Ionicons name="time-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12 }}>Belum ada riwayat</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
