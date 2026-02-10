import { supabase } from "@/lib/supabase";
import type { PickupRequest } from "@/types/database";
import { COLORS, PICKUP_STATUS_LABELS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CollectorJobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: pickup, isLoading } = useQuery({
        queryKey: ["pickup", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("id", id).single();
            if (error) throw error;
            return data as PickupRequest;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            const { error } = await supabase.from("pickup_requests").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pickup", id] });
            queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
        },
    });

    const handleStartPickup = () => {
        Alert.alert("Mulai Pickup", "Konfirmasi bahwa Anda sedang menuju lokasi?", [
            { text: "Batal", style: "cancel" },
            {
                text: "Ya, Mulai",
                onPress: () => updateStatusMutation.mutate("en_route"),
            },
        ]);
    };

    const handleCompletePickup = () => {
        Alert.alert("Selesaikan Pickup", "Konfirmasi bahwa pickup telah selesai?", [
            { text: "Batal", style: "cancel" },
            {
                text: "Ya, Selesai",
                onPress: () => {
                    updateStatusMutation.mutate("completed");
                    Alert.alert("Berhasil", "Pickup telah diselesaikan!", [{ text: "OK", onPress: () => router.back() }]);
                },
            },
        ]);
    };

    if (isLoading || !pickup) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: COLORS.textSecondary }}>Memuat...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 16 }}>
            {/* Status */}
            <View
                style={{
                    backgroundColor: COLORS.primary + "20",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Ionicons name="time" size={24} color={COLORS.primary} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Status</Text>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.primary }}>{PICKUP_STATUS_LABELS[(pickup.status ?? "requested") as keyof typeof PICKUP_STATUS_LABELS]}</Text>
                </View>
            </View>

            {/* Customer Info */}
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Alamat Pickup</Text>
                <Text style={{ fontSize: 14, color: COLORS.text, marginTop: 8 }}>{pickup.address || "-"}</Text>
            </View>

            {/* Waste Types */}
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Jenis Sampah</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {pickup.waste_types.map((type: string) => (
                        <View
                            key={type}
                            style={{
                                backgroundColor: COLORS.primary + "20",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                            }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: "500" }}>{type}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Photos */}
            {pickup.photos && pickup.photos.length > 0 && (
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Foto ({pickup.photos.length})</Text>
                    <ScrollView horizontal style={{ marginTop: 12 }}>
                        {pickup.photos.map((uri: string, idx: number) => (
                            <Image
                                key={idx}
                                source={{ uri }}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 8,
                                    marginRight: 8,
                                }}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Fee */}
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Pendapatan</Text>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: COLORS.success, marginTop: 8 }}>Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}</Text>
            </View>

            {/* Notes */}
            {pickup.notes && (
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>Catatan</Text>
                    <Text style={{ fontSize: 14, color: COLORS.text, marginTop: 8 }}>{pickup.notes}</Text>
                </View>
            )}

            {/* Actions */}
            <View style={{ gap: 12, marginTop: 8 }}>
                {pickup.status === "assigned" && (
                    <TouchableOpacity
                        onPress={handleStartPickup}
                        disabled={updateStatusMutation.isPending}
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Mulai Perjalanan</Text>
                    </TouchableOpacity>
                )}

                {pickup.status === "en_route" && (
                    <TouchableOpacity
                        onPress={handleCompletePickup}
                        disabled={updateStatusMutation.isPending}
                        style={{
                            backgroundColor: COLORS.success,
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Pickup Selesai</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}
