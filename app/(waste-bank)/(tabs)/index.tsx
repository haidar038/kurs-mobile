import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WasteBankDashboard() {
    const { profile, user } = useAuth();
    const router = useRouter();

    // Get Recent Deposits
    const {
        data: recentDeposits,
        isLoading: isLoadingDeposits,
        refetch: refetchDeposits,
    } = useQuery({
        queryKey: ["waste-bank-recent-deposits", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("deposits")
                .select(
                    `
                    *,
                    depositor:profiles!deposits_depositor_id_fkey(full_name)
                `,
                )
                .eq("verified_by", user!.id)
                .order("created_at", { ascending: false })
                .limit(5);

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    // Get Statistics (Aggregation) - For now, client-side calculation from a larger fetch or separate counts
    // For simplicity/performance in this MVP, we might just fetch a count or sum if we had a view or function.
    // Let's just calculate from the recent fetch or do a separate count query.
    // We'll separate fetch for stats to get totals.
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ["waste-bank-stats", user?.id],
        queryFn: async () => {
            // Fetch all deposits for this user to calculate totals.
            // In a real app with many records, use a database function or RPC.
            const { data, error } = await supabase.from("deposits").select("weight, created_at").eq("verified_by", user!.id);

            if (error) throw error;

            const totalWeight = data.reduce((sum, item) => sum + (item.weight || 0), 0);
            const totalTransactions = data.length;

            // Filter for today
            const today = new Date().toISOString().split("T")[0];
            const todayDeposits = data.filter((d) => d.created_at?.startsWith(today));
            const todayWeight = todayDeposits.reduce((sum, item) => sum + (item.weight || 0), 0);

            return { totalWeight, totalTransactions, todayWeight };
        },
        enabled: !!user?.id,
    });

    const onRefresh = async () => {
        await Promise.all([refetchDeposits(), refetchStats()]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isLoadingDeposits} onRefresh={onRefresh} />}>
                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Halo, Staff!</Text>
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>{profile?.full_name}</Text>
                </View>

                {/* Quick Stats */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, backgroundColor: COLORS.primary, padding: 16, borderRadius: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                            <Ionicons name="scale-outline" size={20} color="white" />
                            <Text style={{ color: "rgba(255,255,255,0.8)", marginLeft: 8, fontSize: 12 }}>Total Berat</Text>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
                            {stats?.totalWeight.toFixed(1) || "0"} <Text style={{ fontSize: 14 }}>kg</Text>
                        </Text>
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>+{stats?.todayWeight.toFixed(1) || "0"} kg hari ini</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                            <Ionicons name="documents-outline" size={20} color={COLORS.primary} />
                            <Text style={{ color: COLORS.textSecondary, marginLeft: 8, fontSize: 12 }}>Transaksi</Text>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text }}>{stats?.totalTransactions || "0"}</Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>Total deposit berhasil</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 12, fontFamily: "PublicSans-Bold" }}>Menu Cepat</Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => router.push("/(waste-bank)/scan")}
                            style={{
                                flex: 1,
                                backgroundColor: COLORS.surface,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                                <Ionicons name="scan" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>Scan QR</Text>
                        </TouchableOpacity>

                        <Link href="/(waste-bank)/deposit-form" asChild>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: COLORS.surface,
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondary + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                                    <Ionicons name="create-outline" size={24} color={COLORS.secondary} />
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>Input Manual</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Recent Activity */}
                <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Deposit Terkini</Text>
                        <Link href="/(waste-bank)/(tabs)/history" asChild>
                            <TouchableOpacity>
                                <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "600" }}>Lihat Semua</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {recentDeposits?.map((deposit: any) => (
                        <View
                            key={deposit.id}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: COLORS.surface,
                                padding: 12,
                                borderRadius: 12,
                                marginBottom: 8,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: COLORS.surface,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <Text style={{ fontSize: 18 }}>
                                    {deposit.waste_type === "plastic"
                                        ? "🥤"
                                        : deposit.waste_type === "paper"
                                          ? "📄"
                                          : deposit.waste_type === "metal"
                                            ? "⚙️"
                                            : deposit.waste_type === "glass"
                                              ? "🫙"
                                              : deposit.waste_type === "organic"
                                                ? "🍃"
                                                : deposit.waste_type === "electronic"
                                                  ? "📱"
                                                  : deposit.waste_type === "hazardous"
                                                    ? "☢️"
                                                    : deposit.waste_type === "other"
                                                      ? "📦"
                                                      : "🗑️"}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>{deposit.depositor?.full_name || "Pengguna"}</Text>
                                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{new Date(deposit.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.primary }}>{deposit.weight} kg</Text>
                                <Text style={{ fontSize: 12, color: COLORS.textSecondary, textTransform: "capitalize" }}>{deposit.waste_type}</Text>
                            </View>
                        </View>
                    ))}

                    {recentDeposits?.length === 0 && (
                        <View style={{ alignItems: "center", padding: 24 }}>
                            <Text style={{ color: COLORS.textSecondary }}>Belum ada deposit.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
