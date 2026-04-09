import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
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
    const router = useRouter();

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
        delay = 0,
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
        delay?: number;
    }) => (
        <Animated.View entering={FadeInUp.delay(delay).duration(400)}>
            <Text
                style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: COLORS.textSecondary,
                    marginBottom: 8,
                    marginLeft: 4,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontFamily: "PublicSans-Bold",
                }}
            >
                {label}
            </Text>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.surface,
                    borderWidth: 1.5,
                    borderColor: COLORS.border,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                }}
            >
                <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 15,
                        color: COLORS.text,
                        fontFamily: "PublicSans-Medium",
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
                    <TouchableOpacity onPress={onToggle}>
                        <Ionicons name={isVisible ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <LinearGradient colors={[COLORS.primary + "15", COLORS.background]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }} />

            {/* Decorative Background Circles */}
            <View style={{ position: "absolute", top: -20, right: -20, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.lime + "10" }} />
            <View style={{ position: "absolute", top: 100, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary + "05" }} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    {/* Header Fixed - Back Button */}
                    <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}>
                        <TouchableOpacity
                            onPress={() => {
                                router.replace("/(auth)/login");
                            }}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: COLORS.surface,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                        >
                            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingHorizontal: 24,
                            paddingBottom: 40,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header Text */}
                        <View style={{ marginBottom: 32, marginTop: 10 }}>
                            <Text
                                style={{
                                    fontSize: 32,
                                    fontWeight: "900",
                                    color: COLORS.text,
                                    fontFamily: "PublicSans-Bold",
                                    letterSpacing: -1,
                                    lineHeight: 38,
                                }}
                            >
                                Mulai Aksi Nyata{"\n"}
                                <Text style={{ color: COLORS.primary }}>
                                    Sekarang! <Ionicons name="sparkles" size={24} color={COLORS.lime} />
                                </Text>
                            </Text>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: COLORS.textSecondary,
                                    marginTop: 12,
                                    fontFamily: "PublicSans-Regular",
                                    lineHeight: 22,
                                }}
                            >
                                Isi data diri kamu buat gabung komunitas Jaga Bumi.
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={{ gap: 20 }}>
                            <InputField label="Nama Lengkap" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Cth: Dian Sastro" autoComplete="name" delay={100} />

                            <InputField label="Email Address" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="nama@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" delay={200} />

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
                                delay={300}
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
                                delay={400}
                            />

                            <Animated.View entering={FadeInUp.delay(500).duration(400)} style={{ marginTop: 10 }}>
                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                    style={{
                                        backgroundColor: COLORS.primary,
                                        paddingVertical: 18,
                                        borderRadius: 16,
                                        alignItems: "center",
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        gap: 8,
                                        shadowColor: COLORS.primary,
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 15,
                                        elevation: 8,
                                        opacity: isLoading ? 0.7 : 1,
                                    }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text style={{ color: "white", fontSize: 17, fontWeight: "800", fontFamily: "PublicSans-Bold" }}>Buat Akun</Text>
                                            <Ionicons name="arrow-forward" size={20} color="white" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        marginTop: 24,
                                        gap: 6,
                                    }}
                                >
                                    <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", fontSize: 15 }}>Udah punya akun?</Text>
                                    <Link href="/(auth)/login" asChild>
                                        <TouchableOpacity>
                                            <Text
                                                style={{
                                                    color: COLORS.primary,
                                                    fontWeight: "800",
                                                    fontFamily: "PublicSans-Bold",
                                                    fontSize: 15,
                                                    textDecorationLine: "underline",
                                                    textDecorationColor: COLORS.lime,
                                                }}
                                            >
                                                Masuk Sini
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </Animated.View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
