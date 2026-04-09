import { useHomeData } from "@/hooks/useHomeData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Deposit } from "@/types/database";
import { COLORS, PICKUP_STATUS_LABELS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, SectionList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HistoryItem = {
    id: string;
    type: "pickup" | "deposit";
    status: string;
    date: string;
    details: string;
    location?: string;
    weight?: number;
    points?: number;
};

type Section = {
    title: string;
    data: HistoryItem[];
};

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { stats, loading: loadingStats } = useHomeData();
    const [activeFilter, setActiveFilter] = useState<"all" | "pickup" | "deposit">("all");

    const {
        data: pickups,
        isLoading: loadingPickups,
        refetch: refetchPickups,
    } = useQuery({
        queryKey: ["pickups", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*, collector:collectors(profile:profiles(*))").eq("user_id", user!.id).order("created_at", { ascending: false });
            if (error) throw error;
            return data as any[];
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

    const sections = useMemo<Section[]>(() => {
        let history: HistoryItem[] = [
            ...(pickups?.map((p) => ({
                id: p.id,
                type: "pickup" as const,
                status: p.status ?? "",
                date: p.created_at ?? "",
                details: p.waste_types.join(", "),
                location: "Rumah",
                weight: p.total_weight,
                points: p.total_weight ? p.total_weight * 100 : undefined,
            })) || []),
            ...(deposits?.map((d) => ({
                id: d.id,
                type: "deposit" as const,
                status: d.status ?? "",
                date: d.created_at ?? "",
                details: d.waste_type || "Deposit",
                location: "TPS Terdekat",
                weight: d.weight || 0,
                points: (d.weight || 0) * 100,
            })) || []),
        ];

        // Filter
        if (activeFilter !== "all") {
            history = history.filter((item) => item.type === activeFilter);
        }

        // Sort
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Group by date
        const groups: { [key: string]: HistoryItem[] } = {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        history.forEach((item) => {
            const itemDate = new Date(item.date);
            const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

            let title = "";
            if (itemDay.getTime() === today.getTime()) {
                title = "Hari Ini";
            } else if (itemDay.getTime() === yesterday.getTime()) {
                title = "Kemarin";
            } else {
                title = itemDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
            }

            if (!groups[title]) groups[title] = [];
            groups[title].push(item);
        });

        return Object.keys(groups).map((title) => ({
            title,
            data: groups[title],
        }));
    }, [pickups, deposits, activeFilter]);

    const isLoading = loadingPickups || loadingDeposits || loadingStats;

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
                borderRadius: 20,
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
                    width: 48,
                    height: 48,
                    backgroundColor: item.type === "pickup" ? COLORS.primaryLight : "#F4F1FA",
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={item.type === "pickup" ? "car" : "leaf"} size={22} color={item.type === "pickup" ? COLORS.primary : COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 14, fontFamily: "PublicSans-Bold", color: COLORS.text }}>{item.type === "pickup" ? "Pickup Sampah" : "Setor Bank Sampah"}</Text>
                    <View
                        style={{
                            backgroundColor: item.status === "completed" || item.status === "verified" ? "#F0FDF4" : item.status === "cancelled" ? "#FEF2F2" : "#FFFBEB",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: item.status === "completed" || item.status === "verified" ? "#DCFCE7" : item.status === "cancelled" ? "#FEE2E2" : "#FEF3C7",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 10,
                                fontFamily: "PublicSans-Bold",
                                color: item.status === "completed" || item.status === "verified" ? COLORS.success : item.status === "cancelled" ? COLORS.error : COLORS.warning,
                            }}
                        >
                            {item.type === "pickup" ? PICKUP_STATUS_LABELS[item.status as keyof typeof PICKUP_STATUS_LABELS] : item.status === "verified" ? "Selesai" : item.status}
                        </Text>
                    </View>
                </View>

                <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium", marginTop: 2 }}>{item.location || item.details}</Text>

                {(item.status === "completed" || item.status === "verified") && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
                        <Text style={{ fontSize: 12, fontFamily: "PublicSans-Bold", color: COLORS.text }}>{item.weight} kg</Text>
                        <View style={{ backgroundColor: "rgba(106, 13, 173, 0.05)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ fontSize: 11, fontFamily: "PublicSans-Bold", color: COLORS.primary }}>+{item.points} Poin</Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                {/* Header Section */}
                <View style={{ backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 16 }}>
                    <View style={{ paddingHorizontal: 20, paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Text style={{ fontSize: 24, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Riwayat Aksi</Text>
                        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="options-outline" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Stats Widget */}
                    <View style={{ paddingHorizontal: 20 }}>
                        <View
                            style={{
                                backgroundColor: COLORS.text,
                                borderRadius: 20,
                                padding: 16,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <View>
                                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "PublicSans-Medium", marginBottom: 2 }}>Total Sampah Bulan Ini</Text>
                                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                                    <Text style={{ fontSize: 32, color: "white", fontFamily: "PublicSans-Bold" }}>{stats.totalWeight}</Text>
                                    <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", fontFamily: "PublicSans-Medium" }}>kg</Text>
                                </View>
                            </View>
                            <View style={{ width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.1)" }} />
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "PublicSans-Medium", marginBottom: 2 }}>Poin Didapat</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Text style={{ fontSize: 32, color: COLORS.lime, fontFamily: "PublicSans-Bold" }}>+{stats.points.toLocaleString("id-ID")}</Text>
                                    <Ionicons name="flash" size={16} color={COLORS.lime} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Filter Tabs */}
                    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                        <View style={{ flexDirection: "row", backgroundColor: COLORS.background, borderRadius: 14, padding: 4 }}>
                            {(["all", "pickup", "deposit"] as const).map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    onPress={() => setActiveFilter(filter)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: "center",
                                        borderRadius: 10,
                                        backgroundColor: activeFilter === filter ? COLORS.primary : "transparent",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontFamily: activeFilter === filter ? "PublicSans-Bold" : "PublicSans-Medium",
                                            color: activeFilter === filter ? "white" : COLORS.textSecondary,
                                        }}
                                    >
                                        {filter === "all" ? "Semua" : filter === "pickup" ? "Pickup" : "Setor"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: "PublicSans-Bold",
                                color: COLORS.textSecondary,
                                backgroundColor: COLORS.background,
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                            }}
                        >
                            {title}
                        </Text>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                                <Ionicons name="time-outline" size={40} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: 18, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Belum ada riwayat</Text>
                            <Text style={{ fontSize: 14, fontFamily: "PublicSans-Medium", color: COLORS.textSecondary, marginTop: 4, textAlign: "center", paddingHorizontal: 40 }}>
                                Aksi kamu untuk bumi akan muncul di sini. Yuk mulai sekarang!
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
