import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert("Error", "Lengkapi semua field");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Password tidak sama");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password minimal 6 karakter");
            return;
        }

        setIsLoading(true);
        const { error } = await signUp(email.trim(), password, fullName.trim());
        setIsLoading(false);

        if (error) {
            Alert.alert("Registrasi Gagal", error.message);
        } else {
            Alert.alert("Berhasil", "Akun berhasil dibuat. Silakan cek email untuk verifikasi.", [{ text: "OK" }]);
        }
    };

    const InputField = ({
        label,
        icon,
        value,
        onChangeText,
        placeholder,
        secureTextEntry,
        showToggle,
        isVisible,
        onToggle,
        keyboardType,
        autoCapitalize,
        autoComplete,
    }: {
        label: string;
        icon: keyof typeof Ionicons.glyphMap;
        value: string;
        onChangeText: (text: string) => void;
        placeholder: string;
        secureTextEntry?: boolean;
        showToggle?: boolean;
        isVisible?: boolean;
        onToggle?: () => void;
        keyboardType?: "default" | "email-address";
        autoCapitalize?: "none" | "sentences" | "words" | "characters";
        autoComplete?: "email" | "name" | "password" | "new-password";
    }) => (
        <View>
            <Text
                style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: COLORS.text,
                    marginBottom: 8,
                    fontFamily: "GoogleSans-Medium",
                }}
            >
                {label}
            </Text>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.surface,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                }}
            >
                <View style={{ paddingLeft: 14 }}>
                    <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
                </View>
                <TextInput
                    style={{
                        flex: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        fontSize: 16,
                        fontFamily: "GoogleSans-Regular",
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isVisible}
                    keyboardType={keyboardType || "default"}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                />
                {showToggle && (
                    <TouchableOpacity onPress={onToggle} style={{ paddingRight: 14, paddingVertical: 14 }}>
                        <Ionicons name={isVisible ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        paddingHorizontal: 24,
                        paddingVertical: 48,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={{ alignItems: "center", marginBottom: 40 }}>
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 20,
                                backgroundColor: COLORS.primary + "15",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="person-add" size={32} color={COLORS.primary} />
                        </View>
                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: "bold",
                                color: COLORS.text,
                                fontFamily: "GoogleSans-Bold",
                            }}
                        >
                            Daftar Akun
                        </Text>
                        <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginTop: 8, textAlign: "center", fontFamily: "GoogleSans-Regular" }}>Buat akun untuk mulai menggunakan KURS</Text>
                    </View>

                    {/* Form */}
                    <View style={{ gap: 16 }}>
                        <InputField label="Nama Lengkap" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Nama lengkap" autoComplete="name" />

                        <InputField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

                        <InputField
                            label="Password"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Minimal 6 karakter"
                            secureTextEntry
                            showToggle
                            isVisible={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                            autoComplete="new-password"
                        />

                        <InputField
                            label="Konfirmasi Password"
                            icon="lock-closed-outline"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Ulangi password"
                            secureTextEntry
                            showToggle
                            isVisible={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                            autoComplete="new-password"
                        />

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={isLoading}
                            style={{
                                backgroundColor: COLORS.primary,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                marginTop: 8,
                                opacity: isLoading ? 0.7 : 1,
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "GoogleSans-SemiBold" }}>Daftar</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            marginTop: 32,
                            gap: 4,
                        }}
                    >
                        <Text style={{ color: COLORS.textSecondary, fontFamily: "GoogleSans-Regular" }}>Sudah punya akun?</Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={{ color: COLORS.primary, fontWeight: "600", fontFamily: "GoogleSans-SemiBold" }}>Masuk</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
