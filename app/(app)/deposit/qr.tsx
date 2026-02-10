import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Share, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

interface QRPayload {
    type: "kurs_deposit";
    user_id: string;
    name: string;
    ts: number;
}

export default function DepositQRScreen() {
    const { user, profile } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timestamp, setTimestamp] = useState(() => Date.now());

    const qrPayload = useMemo<string>(() => {
        const payload: QRPayload = {
            type: "kurs_deposit",
            user_id: user?.id ?? "",
            name: profile?.full_name ?? "Pengguna",
            ts: timestamp,
        };
        return JSON.stringify(payload);
    }, [user?.id, profile?.full_name, timestamp]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setTimestamp(Date.now());
        setTimeout(() => setIsRefreshing(false), 500);
    }, []);

    const handleShare = useCallback(async () => {
        try {
            await Share.share({
                message: `Kode Deposit KURS\nNama: ${profile?.full_name ?? "Pengguna"}\nID: ${user?.id ?? "-"}`,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal membagikan QR";
            Alert.alert("Error", message);
        }
    }, [profile?.full_name, user?.id]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View
                style={{
                    flex: 1,
                    padding: 24,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* QR Code */}
                <View
                    style={{
                        width: 280,
                        height: 280,
                        backgroundColor: COLORS.surface,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginBottom: 24,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }}
                >
                    {isRefreshing ? <ActivityIndicator size="large" color={COLORS.primary} /> : <QRCode value={qrPayload} size={220} color={COLORS.text} backgroundColor={COLORS.surface} />}
                </View>

                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: COLORS.text,
                        textAlign: "center",
                    }}
                >
                    {profile?.full_name || "Pengguna"}
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        color: COLORS.textSecondary,
                        textAlign: "center",
                        marginTop: 8,
                    }}
                >
                    Tunjukkan QR ini ke petugas Bank Sampah
                </Text>

                {/* Refresh Button */}
                <TouchableOpacity
                    onPress={handleRefresh}
                    style={{
                        marginTop: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: COLORS.primary + "15",
                    }}
                >
                    <Ionicons name="refresh" size={18} color={COLORS.primary} />
                    <Text
                        style={{
                            marginLeft: 6,
                            color: COLORS.primary,
                            fontSize: 14,
                            fontWeight: "600",
                        }}
                    >
                        Refresh QR
                    </Text>
                </TouchableOpacity>

                {/* Info card */}
                <View
                    style={{
                        marginTop: 24,
                        backgroundColor: COLORS.primary + "10",
                        padding: 16,
                        borderRadius: 12,
                        width: "100%",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                        <Text
                            style={{
                                flex: 1,
                                marginLeft: 12,
                                color: COLORS.text,
                                fontSize: 14,
                                lineHeight: 20,
                            }}
                        >
                            Petugas akan memindai kode QR Anda untuk mencatat deposit sampah ke akun Anda.
                        </Text>
                    </View>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                    onPress={handleShare}
                    style={{
                        marginTop: 24,
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                    }}
                >
                    <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                    <Text
                        style={{
                            marginLeft: 8,
                            color: COLORS.primary,
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        Bagikan QR
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
