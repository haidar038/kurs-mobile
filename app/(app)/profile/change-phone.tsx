import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePhoneScreen() {
    const { profile, user, refreshProfile } = useAuth();
    const router = useRouter();
    const [phone, setPhone] = useState(profile?.phone || "");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setPhone(profile.phone || "");
        }
    }, [profile]);

    const handleSave = async () => {
        if (!phone.trim()) {
            Alert.alert("Error", "Nomor HP tidak boleh kosong.");
            return;
        }

        // Basic phone number validation (digits only, 9-15 chars)
        const phoneRegex = /^[0-9]{9,15}$/;
        if (!phoneRegex.test(phone.trim().replace(/\+/g, ""))) {
            Alert.alert("Error", "Format nomor HP tidak valid.");
            return;
        }

        if (!user?.id) {
            Alert.alert("Error", "Sesi tidak ditemukan.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from("profiles").update({ phone: phone.trim() }).eq("id", user.id);

            if (error) throw error;

            await refreshProfile();
            Alert.alert("Sukses", "Nomor HP berhasil diperbarui.", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert("Gagal Memperbarui Nomor HP", error.message);
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
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Ubah Nomor HP</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Medium" }}>Nomor HP Baru</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.surface,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    borderRadius: 12,
                                    padding: 14,
                                    fontSize: 16,
                                    fontFamily: "PublicSans-Regular",
                                    color: COLORS.text,
                                }}
                                placeholder="Contoh: 08123456789"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontFamily: "PublicSans-Regular" }}>Gunakan format angka saja, contoh: 08123456789</Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
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
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Simpan Perubahan</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
