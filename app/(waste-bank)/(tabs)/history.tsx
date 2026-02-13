import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS, WASTE_TYPES } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WasteBankHistoryScreen() {
    const { user } = useAuth();

    const {
        data: deposits,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["waste-bank-all-history", user?.id],
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
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const renderDepositCard = ({ item }: { item: any }) => {
        const wasteType = WASTE_TYPES.find((t) => t.id === item.waste_type);

        return (
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
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: COLORS.secondary + "20",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ fontSize: 24 }}>{wasteType?.icon || "♻️"}</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>{item.depositor?.full_name || "Pengguna"}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                                {new Date(item.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={{
                            backgroundColor: COLORS.success + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: "600", textTransform: "capitalize" }}>{item.status}</Text>
                    </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.background, padding: 12, borderRadius: 8 }}>
                    <View>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Jenis Sampah</Text>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>{wasteType?.label || item.waste_type}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Berat</Text>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.primary }}>{item.weight} kg</Text>
                    </View>
                </View>

                {item.notes && <Text style={{ marginTop: 12, fontSize: 13, color: COLORS.textSecondary, fontStyle: "italic" }}>&quot;{item.notes}&quot;</Text>}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ flex: 1, padding: 24 }}>
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "GoogleSans-Bold" }}>Riwayat Deposit</Text>
                    <Text style={{ fontSize: 15, color: COLORS.textSecondary, fontFamily: "GoogleSans-Regular", marginTop: 4 }}>Daftar semua deposit yang telah Anda verifikasi</Text>
                </View>

                <FlatList
                    data={deposits}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDepositCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
                            <Ionicons name="documents-outline" size={64} color={COLORS.textSecondary} />
                            <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Belum ada riwayat deposit</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
