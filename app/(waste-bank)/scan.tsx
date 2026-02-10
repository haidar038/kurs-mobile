import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function WasteBankScanScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 24,
                    backgroundColor: COLORS.background,
                }}
            >
                <Ionicons name="camera" size={48} color={COLORS.textSecondary} />
                <Text
                    style={{
                        fontSize: 16,
                        color: COLORS.text,
                        textAlign: "center",
                        marginTop: 16,
                    }}
                >
                    Izin kamera diperlukan untuk scan QR
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={{
                        marginTop: 24,
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>Izinkan Kamera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);

        try {
            const qrData = JSON.parse(data);
            if (qrData.type === "kurs_deposit" && qrData.user_id) {
                router.push({
                    pathname: "/(waste-bank)/deposit-form",
                    params: {
                        depositor_id: qrData.user_id,
                        depositor_name: qrData.name || "Pengguna",
                    },
                });
            } else {
                Alert.alert("Error", "QR Code tidak valid", [{ text: "OK", onPress: () => setScanned(false) }]);
            }
        } catch (e) {
            Alert.alert("Error", "Format QR tidak dikenali", [{ text: "OK", onPress: () => setScanned(false) }]);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <CameraView
                style={{ flex: 1 }}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                {/* Overlay */}
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {/* Scan Frame */}
                    <View
                        style={{
                            width: 250,
                            height: 250,
                            borderWidth: 3,
                            borderColor: "white",
                            borderRadius: 20,
                            backgroundColor: "transparent",
                        }}
                    />
                    <Text
                        style={{
                            color: "white",
                            fontSize: 16,
                            marginTop: 24,
                            textAlign: "center",
                        }}
                    >
                        Arahkan kamera ke QR Depositor
                    </Text>
                </View>
            </CameraView>
        </View>
    );
}
