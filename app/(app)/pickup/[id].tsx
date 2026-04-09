import { supabase } from "@/lib/supabase";
import type { PickupRequest } from "@/types/database";
import { COLORS, PICKUP_STATUS_LABELS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_STEPS = ["requested", "assigned", "en_route", "completed"] as const;

export default function PickupTrackerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data: pickup, isLoading } = useQuery({
        queryKey: ["pickup", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("pickup_requests")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data as PickupRequest;
        },
        // Realtime handles live updates; polling is a fallback safety net only.
        refetchInterval: 30_000,
    });

    const { data: payment } = useQuery({
        queryKey: ["payment", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("payments")
                .select("*")
                .eq("pickup_request_id", id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error && error.code !== "PGRST116") throw error;
            return data;
        },
        // Same reasoning — realtime handles this.
        refetchInterval: 30_000,
    });

    // FIX: Derive QR state directly from the query instead of duplicating it in
    // local state. Previously, three separate useState values mirrored `payment`
    // via a useEffect, creating a window where they could diverge (e.g. payment
    // updates but state hasn't flushed yet) causing a stale QR or a hidden
    // "Bayar" button when the invoice still exists.
    const hasPendingQr = payment?.status === "pending" && !!payment?.qr_string;
    const qrString = hasPendingQr ? payment.qr_string : null;
    const externalId = hasPendingQr ? payment.external_id : null;
    const qrCodeId = hasPendingQr ? payment.qr_id : null;

    const payMutation = useMutation({
        mutationFn: async () => {
            if (!pickup?.fee) throw new Error("Biaya pickup tidak ditemukan");
            const { data, error } = await supabase.functions.invoke("xendit-create-invoice", {
                body: { amount: pickup.fee, pickup_id: id },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate so the query re-fetches the new payment row from DB.
            // No need to set local state at all anymore.
            queryClient.invalidateQueries({ queryKey: ["payment", id] });
            Alert.alert("QR Code Generated", "Silakan scan QRIS untuk melakukan pembayaran.");
        },
        onError: (error: Error) => {
            Alert.alert("Error", "Gagal membuat invoice: " + error.message);
        },
    });

    // FIX: Guard with __DEV__ so simulate button is never compiled into release builds.
    const handleSimulatePayment = async () => {
        if (!externalId) {
            Alert.alert("Error", "External ID tidak ditemukan. Silakan buat invoice ulang.");
            return;
        }
        try {
            const { error } = await supabase.functions.invoke("xendit-simulate-payment", {
                body: {
                    external_id: externalId,
                    qr_code_id: qrCodeId,
                    amount: pickup?.fee ?? 10000,
                },
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["payment", id] });
            Alert.alert("Simulasi Berhasil", "Pembayaran telah disimulasikan. Tunggu sebentar untuk update status.");
        } catch (error: any) {
            Alert.alert("Error Simulasi", error.message);
        }
    };

    useEffect(() => {
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
                        // No need to call setQrString(null) — derived state handles this.
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

    const currentStepIndex = STATUS_STEPS.indexOf(pickup.status as any ?? "requested");
    // FIX: Guard against null/undefined before calling .join()
    const wasteTypesList = Array.isArray(pickup.waste_types) ? pickup.waste_types.join(", ") : "-";

    const showPaymentSection =
        (pickup.status === "assigned" || pickup.status === "en_route") &&
        payment?.status !== "completed";

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
                                backgroundColor:
                                    pickup.status === "completed"
                                        ? COLORS.success + "20"
                                        : COLORS.primary + "20",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons
                                name={pickup.status === "completed" ? "checkmark-circle" : "time"}
                                size={32}
                                color={pickup.status === "completed" ? COLORS.success : COLORS.primary}
                            />
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
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>
                                {pickup.address || "-"}
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="cube" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>
                                {wasteTypesList}
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="cash" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>
                                Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <Ionicons name="calendar" size={18} color={COLORS.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>
                                {new Date(pickup.created_at ?? "").toLocaleString("id-ID")}
                            </Text>
                        </View>

                        {pickup.notes && (
                            <View style={{ flexDirection: "row" }}>
                                <Ionicons name="document-text" size={18} color={COLORS.textSecondary} />
                                <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>
                                    {pickup.notes}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Payment Action */}
                {showPaymentSection && (
                    <View style={{ marginTop: 24, alignItems: "center" }}>
                        {qrString ? (
                            <View
                                style={{
                                    backgroundColor: "white",
                                    padding: 20,
                                    borderRadius: 16,
                                    alignItems: "center",
                                    width: "100%",
                                }}
                            >
                                <QRCode value={qrString} size={200} />
                                <Text style={{ marginTop: 16, fontWeight: "bold", fontSize: 16 }}>
                                    Scan QRIS untuk Bayar
                                </Text>
                                <Text style={{ marginTop: 4, color: COLORS.textSecondary, marginBottom: 16 }}>
                                    Rp {(pickup.fee ?? 0).toLocaleString("id-ID")}
                                </Text>

                                {/* FIX: Simulate button only renders in dev builds */}
                                {__DEV__ && externalId && (
                                    <TouchableOpacity
                                        onPress={handleSimulatePayment}
                                        style={{
                                            backgroundColor: COLORS.secondary,
                                            paddingVertical: 10,
                                            paddingHorizontal: 20,
                                            borderRadius: 8,
                                            marginTop: 10,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                                            Simulasi Bayar (Dev Only)
                                        </Text>
                                    </TouchableOpacity>
                                )}
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
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                                        Memproses Invoice...
                                    </Text>
                                ) : (
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                                        Bayar dengan QRIS
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {!qrString && (
                            <Text style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: COLORS.textSecondary }}>
                                Pembayaran aman menggunakan Xendit QRIS
                            </Text>
                        )}
                    </View>
                )}

                {payment?.status === "completed" && (
                    <View
                        style={{
                            marginTop: 24,
                            padding: 16,
                            backgroundColor: COLORS.success + "20",
                            borderRadius: 12,
                            alignItems: "center",
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                        <Text style={{ marginTop: 8, fontSize: 16, fontWeight: "bold", color: COLORS.success }}>
                            Lunas
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                            Pembayaran telah dikonfirmasi via Xendit
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
