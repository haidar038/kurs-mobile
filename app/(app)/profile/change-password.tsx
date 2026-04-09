import { supabase } from "@/lib/supabase";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!password || !confirmPassword) {
            Alert.alert("Error", "Mohon isi semua field.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password minimal 6 karakter.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Konfirmasi password tidak cocok.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            Alert.alert("Sukses", "Password berhasil diperbarui.", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert("Gagal Memperbarui Password", error.message);
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
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Ubah Password</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Medium" }}>Password Baru</Text>
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
                                placeholder="Minimal 6 karakter"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Medium" }}>Konfirmasi Password Baru</Text>
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
                                placeholder="Ulangi password baru"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
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
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Simpan Password</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
