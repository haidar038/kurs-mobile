import { supabase } from "@/lib/supabase";
import type { PickupRequest } from "@/types/database";
import { COLORS, PICKUP_STATUS_LABELS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_STEPS = ["requested", "assigned", "en_route", "completed"];

export default function PickupTrackerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [qrString, setQrString] = useState<string | null>(null);
    const [externalId, setExternalId] = useState<string | null>(null);
    const [qrCodeId, setQrCodeId] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const queryClient = useQueryClient();

    const { data: pickup, isLoading } = useQuery({
        queryKey: ["pickup", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("id", id).single();
            if (error) throw error;
            return data as PickupRequest;
        },
        refetchInterval: 5000,
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

    // Handle persistence of QR data from DB
    useEffect(() => {
        if (payment && payment.status === "pending" && payment.qr_string) {
            setQrString(payment.qr_string);
            setExternalId(payment.external_id);
            setQrCodeId(payment.qr_id);
        } else if (payment && payment.status === "completed") {
            setQrString(null);
            setExternalId(null);
            setQrCodeId(null);
        }
    }, [payment]);

    const payMutation = useMutation({
        mutationFn: async () => {
            if (!pickup?.fee) throw new Error("Biaya pickup tidak ditemukan");

            const { data, error } = await supabase.functions.invoke("xendit-create-invoice", {
                body: {
                    amount: pickup.fee,
                    pickup_id: id,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data?.qr_string) {
                setQrString(data.qr_string);
                setExternalId(data.external_id);
                setQrCodeId(data.id);
                // Invalidate query to update state from DB
                queryClient.invalidateQueries({ queryKey: ["payment", id] });
                Alert.alert("QR Code Generated", "Silakan scan QRIS untuk melakukan pembayaran.");
            }
        },
        onError: (error) => {
            Alert.alert("Error", "Gagal membuat invoice: " + error.message);
        },
    });

    const handleSimulatePayment = async () => {
        if (!externalId) {
            Alert.alert("Error", "External ID tidak ditemukan. Silakan buat invoice ulang.");
            return;
        }
        setIsSimulating(true);
        try {
            const { data, error } = await supabase.functions.invoke("xendit-simulate-payment", {
                body: {
                    external_id: externalId,
                    qr_code_id: qrCodeId,
                    amount: pickup?.fee || 10000,
                },
            });

            if (error) {
                throw error;
            }

            // Proactively invalidate to trigger refetch
            queryClient.invalidateQueries({ queryKey: ["payment", id] });

            Alert.alert("Simulasi Berhasil", "Pembayaran telah disimulasikan. Tunggu sebentar untuk update status.");
        } catch (error: any) {
            Alert.alert("Error Simulasi", error.message);
        } finally {
            setIsSimulating(false);
        }
    };

    useEffect(() => {
        // Subscribe to realtime updates for payments
        const channel = supabase
            .channel(`payment-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "payments",
                    filter: `pickup_request_id=eq.${id}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ["payment", id] });
                    if (payload.new.status === "completed") {
                        setQrString(null); // Hide QR once paid
                        Alert.alert("Pembayaran Berhasil", "Terima kasih, pembayaran Anda telah diterima.");
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, queryClient]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!pickup) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: COLORS.textSecondary }}>Pickup tidak ditemukan</Text>
            </View>
        );
    }

    const currentStepIndex = STATUS_STEPS.indexOf(pickup.status ?? "");

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {/* Status Card */}
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 20,
                    }}
                >
                    <View style={{ alignItems: "center" }}>
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: pickup.status === "completed" ? COLORS.success + "20" : COLORS.primary + "20",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name={pickup.status === "completed" ? "checkmark-circle" : "time"} size={32} color={pickup.status === "completed" ? COLORS.success : COLORS.primary} />
                        </View>
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "bold",
                                color: COLORS.text,
                                marginTop: 16,
                            }}
                        >
                            {PICKUP_STATUS_LABELS[(pickup.status ?? "requested") as keyof typeof PICKUP_STATUS_LABELS]}
                        </Text>
                    </View>

                    {/* Progress Steps */}
                    <View style={{ flexDirection: "row", marginTop: 32 }}>
                        {STATUS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            return (
                                <View key={step} style={{ flex: 1, alignItems: "center" }}>
                                    <View
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: isCompleted ? COLORS.primary : COLORS.border,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {isCompleted && <Ionicons name="checkmark" size={14} color="white" />}
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            color: isCurrent ? COLORS.primary : COLORS.textSecondary,
                                            marginTop: 4,
                                            textAlign: "center",
                                        }}
                                    >
                                        {PICKUP_STATUS_LABELS[step as keyof typeof PICKUP_STATUS_LABELS]}
                                    </Text>
                                    {index < STATUS_STEPS.length - 1 && (
                                        <View
                                            style={{
                                                position: "absolute",
                                                left: "50%",
                                                top: 11,
                                                width: "100%",
                                                height: 2,
                                                backgroundColor: isCompleted ? COLORS.primary : COLORS.border,
                                            }}
                                        />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Details */}
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 20,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>Detail Pickup</Text>

                    <View style={{ marginTop: 16, gap: 12 }}>
                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="location" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>{pickup.address || "-"}</Text>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="cube" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>{pickup.waste_types.join(", ")}</Text>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="cash" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}</Text>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="calendar" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>{new Date(pickup.created_at ?? "").toLocaleString("id-ID")}</Text>
                        </View>

                        {pickup.notes && (
                            <View style={{ flexDirection: "row" }}>
                                <Ionicons name="document-text" size={18} color={COLORS.textSecondary} />
                                <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>{pickup.notes}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Payment Action */}
                {pickup && (pickup.status === "assigned" || pickup.status === "en_route") && (!payment || payment.status === "pending") && (
                    <View style={{ marginTop: 24, alignItems: "center" }}>
                        {qrString ? (
                            <View style={{ backgroundColor: "white", padding: 20, borderRadius: 16, alignItems: "center", width: "100%" }}>
                                <QRCode value={qrString} size={200} />
                                <Text style={{ marginTop: 16, fontWeight: "bold", fontSize: 16 }}>Scan QRIS untuk Bayar</Text>
                                <Text style={{ marginTop: 4, color: COLORS.textSecondary, marginBottom: 16 }}>Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}</Text>

                                {externalId && (
                                    <TouchableOpacity
                                        onPress={handleSimulatePayment}
                                        disabled={isSimulating}
                                        style={{
                                            backgroundColor: COLORS.secondary,
                                            paddingVertical: 10,
                                            paddingHorizontal: 20,
                                            borderRadius: 8,
                                            marginTop: 10,
                                            marginBottom: 10,
                                        }}
                                    >
                                        {isSimulating ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>Simulasi Bayar (Dev Only)</Text>}
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity onPress={() => setQrString(null)} style={{ marginTop: 10, padding: 10 }}>
                                    <Text style={{ color: COLORS.error }}>Batalkan</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => payMutation.mutate()}
                                disabled={payMutation.isPending}
                                style={{
                                    backgroundColor: COLORS.primary,
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    width: "100%",
                                    opacity: payMutation.isPending ? 0.7 : 1,
                                }}
                            >
                                {payMutation.isPending ? (
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Memproses Invoice...</Text>
                                ) : (
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Bayar dengan QRIS</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {!qrString && <Text style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: COLORS.textSecondary }}>Pembayaran aman menggunakan Xendit QRIS</Text>}
                    </View>
                )}

                {payment && payment.status === "completed" && (
                    <View style={{ marginTop: 24, padding: 16, backgroundColor: COLORS.success + "20", borderRadius: 12, alignItems: "center" }}>
                        <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                        <Text style={{ marginTop: 8, fontSize: 16, fontWeight: "bold", color: COLORS.success }}>Lunas</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Pembayaran telah dikonfirmasi via Xendit</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
