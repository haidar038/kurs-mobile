import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import JagaBumiSecondary from "../../assets/images/jgbm-secondary.svg";

export default function LoginScreen() {
    const { type } = useLocalSearchParams<{ type: string }>();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signOut, switchRole } = useAuth();
    const router = useRouter();

    // Floating animation for logo
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(withSequence(withTiming(-10, { duration: 2500 }), withTiming(0, { duration: 2500 })), -1, true);
    }, [translateY]);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Configuration based on role type
    const config = useMemo(() => {
        switch (type) {
            case "collector":
                return {
                    title: "Halo, Mitra! 👋",
                    subtitle: "Lanjutin misi jemput sampah kamu sekarang.",
                    color: "#3B82F6",
                    icon: "car" as keyof typeof Ionicons.glyphMap,
                    showRegister: false,
                };
            case "staff":
                return {
                    title: "Apa Kabar, Staff? 👋",
                    subtitle: "Ayo kelola operasional hari ini.",
                    color: "#8B5CF6",
                    icon: "business" as keyof typeof Ionicons.glyphMap,
                    showRegister: false,
                };
            default:
                return {
                    title: "Welcome Back! 👋",
                    subtitle: "Lanjutin misi jaga bumi kamu sekarang.",
                    color: COLORS.primary,
                    icon: "person" as keyof typeof Ionicons.glyphMap,
                    showRegister: true,
                };
        }
    }, [type]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Masukkan email dan password");
            return;
        }

        setIsLoading(true);
        const { error } = await signIn(email.trim(), password);

        if (error) {
            setIsLoading(false);
            Alert.alert("Login Gagal", error.message);
            return;
        }

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
            const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
            const userRoles = (rolesData?.map((r) => r.role) as any[]) || [];

            setIsLoading(false);

            let isAuthorized = false;
            let errorMessage = "";
            let targetRole = "";

            if (type === "collector") {
                if (userRoles.includes("collector")) {
                    isAuthorized = true;
                    targetRole = "collector";
                } else {
                    errorMessage = "Akun Anda tidak terdaftar sebagai Mitra.";
                }
            } else if (type === "staff") {
                if (userRoles.includes("waste_bank_staff")) {
                    isAuthorized = true;
                    targetRole = "waste_bank_staff";
                } else {
                    errorMessage = "Akun Anda tidak memiliki akses Staff Bank Sampah.";
                }
            } else {
                if (userRoles.includes("user") || userRoles.includes("collector") || userRoles.includes("waste_bank_staff")) {
                    isAuthorized = true;
                    targetRole = "user";
                } else {
                    errorMessage = "Role akun Anda tidak didukung di portal ini.";
                }
            }

            if (isAuthorized) {
                if (targetRole === "collector") {
                    switchRole("collector");
                    router.replace("/(collector)/(tabs)/dashboard" as any);
                } else if (targetRole === "waste_bank_staff") {
                    router.replace("/(waste-bank)/(tabs)" as any);
                } else {
                    switchRole("user");
                    router.replace("/(app)/(tabs)/home" as any);
                }
            } else {
                await signOut(`/(auth)/login?type=${type}`);
                Alert.alert("Akses Ditolak", errorMessage);
            }
        } else {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <LinearGradient colors={[config.color + "15", COLORS.background]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400 }} />

            {/* Decorative Background Shadows */}
            <View style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: config.color + "08" }} />
            <View style={{ position: "absolute", bottom: "30%", right: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: config.color + "05" }} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => {
                                router.replace("/(auth)/welcome");
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
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={{ alignItems: "center", marginBottom: 40 }}>
                            <Animated.View style={[animatedLogoStyle]}>
                                <View
                                    style={{
                                        width: 88,
                                        height: 88,
                                        borderRadius: 28,
                                        backgroundColor: COLORS.surface,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        shadowColor: config.color,
                                        shadowOffset: { width: 0, height: 10 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 15,
                                        elevation: 8,
                                        alignItems: "center",
                                    }}
                                >
                                    <JagaBumiSecondary width={70} height={70} />
                                </View>
                            </Animated.View>
                            <Text
                                style={{
                                    fontSize: 28,
                                    fontWeight: "900",
                                    color: COLORS.text,
                                    fontFamily: "PublicSans-Bold",
                                    marginTop: 24,
                                    letterSpacing: -0.5,
                                }}
                            >
                                {config.title}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: COLORS.textSecondary,
                                    marginTop: 8,
                                    textAlign: "center",
                                    fontFamily: "PublicSans-Regular",
                                    paddingHorizontal: 20,
                                    lineHeight: 20,
                                }}
                            >
                                {config.subtitle}
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={{ gap: 20 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 1 }}>Email</Text>
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
                                    <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            paddingVertical: 14,
                                            paddingHorizontal: 12,
                                            fontSize: 15,
                                            color: COLORS.text,
                                            fontFamily: "PublicSans-Medium",
                                        }}
                                        placeholder="nama@email.com"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 1 }}>Password</Text>
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
                                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            paddingVertical: 14,
                                            paddingHorizontal: 12,
                                            fontSize: 15,
                                            color: COLORS.text,
                                            fontFamily: "PublicSans-Medium",
                                        }}
                                        placeholder="••••••••"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <Link href="/(auth)/forgot-password" asChild>
                                    <TouchableOpacity style={{ alignSelf: "flex-end", marginTop: 8 }}>
                                        <Text style={{ color: config.color, fontSize: 13, fontWeight: "700", fontFamily: "PublicSans-Bold" }}>Lupa password?</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: config.color,
                                    paddingVertical: 18,
                                    borderRadius: 16,
                                    alignItems: "center",
                                    marginTop: 8,
                                    opacity: isLoading ? 0.7 : 1,
                                    shadowColor: config.color,
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 12,
                                    elevation: 6,
                                }}
                            >
                                {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 17, fontWeight: "800", fontFamily: "PublicSans-Bold" }}>Masuk Sekarang</Text>}
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        {config.showRegister && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    marginTop: 40,
                                    paddingBottom: 20,
                                    gap: 6,
                                }}
                            >
                                <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", fontSize: 15 }}>Belum punya akun?</Text>
                                <Link href="/(auth)/register" asChild>
                                    <TouchableOpacity>
                                        <Text
                                            style={{
                                                color: config.color,
                                                fontWeight: "800",
                                                fontFamily: "PublicSans-Bold",
                                                fontSize: 15,
                                                textDecorationLine: "underline",
                                                textDecorationColor: COLORS.lime,
                                            }}
                                        >
                                            Daftar Dulu
                                        </Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
