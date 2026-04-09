import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
    const { profile, user, refreshProfile } = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
        }
    }, [profile]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Error", "Nama lengkap tidak boleh kosong.");
            return;
        }

        if (!user?.id) {
            Alert.alert("Error", "Sesi tidak ditemukan.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);

            if (error) throw error;

            await refreshProfile();
            Alert.alert("Sukses", "Profil berhasil diperbarui.", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert("Gagal Memperbarui Profil", error.message);
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
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Edit Profil</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Medium" }}>Nama Lengkap</Text>
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
                                placeholder="Masukkan nama lengkap"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Medium" }}>Email</Text>
                            <TextInput
                                style={{
                                    backgroundColor: COLORS.background,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    borderRadius: 12,
                                    padding: 14,
                                    fontSize: 16,
                                    fontFamily: "PublicSans-Regular",
                                    color: COLORS.textSecondary,
                                }}
                                value={user?.email}
                                editable={false}
                            />
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontFamily: "PublicSans-Regular" }}>Email tidak dapat diubah.</Text>
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
