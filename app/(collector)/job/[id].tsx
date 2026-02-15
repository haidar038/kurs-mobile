import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { PickupRequest } from "@/types/database";
import { COLORS, PICKUP_STATUS_LABELS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CollectorJobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { user } = useAuth();

    const { data: pickup, isLoading } = useQuery({
        queryKey: ["pickup", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("id", id).single();
            if (error) throw error;
            return data as PickupRequest;
        },
        refetchInterval: 5000,
    });

    const { data: collector } = useQuery({
        queryKey: ["collector", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("collectors").select("*").eq("user_id", user!.id).single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const { data: payment } = useQuery({
        queryKey: ["payment", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("payments").select("*").eq("pickup_request_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (error && error.code !== "PGRST116") throw error;
            return data;
        },
        refetchInterval: 5000,
    });

    useEffect(() => {
        // Subscribe to realtime updates for payments
        const channel = supabase
            .channel(`payment-collector-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "payments",
                    filter: `pickup_request_id=eq.${id}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["payment", id] });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, queryClient]);

    const acceptJobMutation = useMutation({
        mutationFn: async () => {
            if (!collector?.id) throw new Error("Collector ID not found");

            const { error } = await supabase
                .from("pickup_requests")
                .update({
                    collector_id: collector.id,
                    status: "assigned",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pickup", id] });
            queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
            Alert.alert("Berhasil", "Job berhasil diambil!");
        },
        onError: (error) => {
            Alert.alert("Error", "Gagal mengambil job: " + error.message);
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

    const handleAcceptJob = () => {
        Alert.alert("Ambil Job", "Apakah Anda yakin ingin mengambil job ini?", [
            { text: "Batal", style: "cancel" },
            { text: "Ya, Ambil", onPress: () => acceptJobMutation.mutate() },
        ]);
    };

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
        if (payment?.status !== "completed") {
            Alert.alert("Belum Bayar", "Pelanggan belum melakukan pembayaran.");
            return;
        }

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
                {pickup.status === "requested" && (
                    <TouchableOpacity
                        onPress={handleAcceptJob}
                        disabled={acceptJobMutation.isPending}
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: "center",
                            opacity: acceptJobMutation.isPending ? 0.7 : 1,
                        }}
                    >
                        {acceptJobMutation.isPending ? <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Memproses...</Text> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Ambil Job</Text>}
                    </TouchableOpacity>
                )}

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
                    <View>
                        {!payment && (
                            <View style={{ marginBottom: 12, padding: 12, backgroundColor: COLORS.warning + "20", borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
                                <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                                <Text style={{ marginLeft: 8, color: COLORS.warning, fontWeight: "500", fontSize: 14 }}>Menunggu Pembayaran User</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={handleCompletePickup}
                            disabled={updateStatusMutation.isPending || payment?.status !== "completed"}
                            style={{
                                backgroundColor: payment?.status !== "completed" ? COLORS.textSecondary : COLORS.success,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                opacity: payment?.status !== "completed" ? 0.6 : 1,
                            }}
                        >
                            {updateStatusMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{payment?.status === "completed" ? "Pickup Selesai" : "Menunggu Pembayaran"}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
