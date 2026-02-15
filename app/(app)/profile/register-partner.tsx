import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterPartnerScreen() {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const [vehicleType, setVehicleType] = useState("");
    const [licensePlate, setLicensePlate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!vehicleType || !licensePlate) {
            Alert.alert("Error", "Mohon lengkapi semua data.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Insert into role_applications table
            const { error } = await supabase.from("role_applications").insert({
                user_id: user?.id,
                requested_role: "collector",
                status: "pending",
                metadata: {
                    vehicle_type: vehicleType,
                    license_plate: licensePlate,
                },
            });

            if (error) throw error;

            Alert.alert("Pendaftaran Dikirim", "Permohonan Anda sebagai Mitra telah dikirim. Mohon tunggu verifikasi dari Admin untuk mengaktifkan akun Mitra Anda.", [
                {
                    text: "OK",
                    onPress: () => {
                        refreshProfile();
                        router.back();
                    },
                },
            ]);
        } catch (error: any) {
            Alert.alert("Gagal Mengirim Pendaftaran", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "GoogleSans-Bold" }}>Daftar Mitra</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 24, fontFamily: "GoogleSans-Regular" }}>
                        Bergabunglah sebagai mitra Kurir Sampah untuk mendapatkan penghasilan tambahan dengan membantu mengelola sampah di lingkungan Anda.
                    </Text>

                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "GoogleSans-Medium" }}>Jenis Kendaraan</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.surface,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    borderRadius: 12,
                                    padding: 14,
                                    fontSize: 16,
                                    fontFamily: "GoogleSans-Regular",
                                }}
                                placeholder="Contoh: Motor / Mobil Pickup"
                                value={vehicleType}
                                onChangeText={setVehicleType}
                            />
                        </View>

                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "GoogleSans-Medium" }}>Plat Nomor</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.surface,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    borderRadius: 12,
                                    padding: 14,
                                    fontSize: 16,
                                    fontFamily: "GoogleSans-Regular",
                                }}
                                placeholder="Contoh: B 1234 XYZ"
                                value={licensePlate}
                                onChangeText={setLicensePlate}
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading}
                            style={{
                                backgroundColor: COLORS.primary,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                marginTop: 16,
                                opacity: isLoading ? 0.7 : 1,
                            }}
                        >
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "GoogleSans-SemiBold" }}>Kirim Pendaftaran</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
