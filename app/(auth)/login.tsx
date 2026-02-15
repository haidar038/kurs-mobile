import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const { type } = useLocalSearchParams<{ type: string }>();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signOut, switchRole } = useAuth();
    const router = useRouter();

    // Configuration based on role type
    const config = useMemo(() => {
        switch (type) {
            case "collector":
                return {
                    title: "Masuk Mitra",
                    subtitle: "Kurir Driver",
                    color: "#3B82F6",
                    icon: "bicycle" as keyof typeof Ionicons.glyphMap,
                    showRegister: false,
                };
            case "staff":
                return {
                    title: "Masuk Staff",
                    subtitle: "Bank Sampah",
                    color: "#8B5CF6",
                    icon: "business" as keyof typeof Ionicons.glyphMap,
                    showRegister: false,
                };
            default:
                return {
                    title: "Masuk Pengguna",
                    subtitle: "Kurir Sampah",
                    color: COLORS.primary,
                    icon: "leaf" as keyof typeof Ionicons.glyphMap,
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

        // Fetch profile manually to check role immediately
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
            // Fetch all roles for the user
            const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
            const userRoles = (rolesData?.map((r) => r.role) as any[]) || [];

            setIsLoading(false);

            // Strict Role Validation Logic
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
                // Default User portal login
                // Allows ANYONE with 'user', 'collector', or 'waste_bank_staff' role
                if (userRoles.includes("user") || userRoles.includes("collector") || userRoles.includes("waste_bank_staff")) {
                    isAuthorized = true;
                    targetRole = "user";
                } else {
                    errorMessage = "Role akun Anda tidak didukung di portal ini.";
                }
            }

            if (isAuthorized) {
                // Final redirection after validation
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
                // Not authorized for this portal - FORCE SIGN OUT
                // Stay on the same portal login page after sign out
                await signOut(`/(auth)/login?type=${type}`);
                Alert.alert("Akses Ditolak", errorMessage);
            }
        } else {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace("/(auth)/welcome");
                            }
                        }}
                        style={{ position: "absolute", top: 10, left: 10, padding: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={{ alignItems: "center", marginBottom: 40 }}>
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 24,
                                backgroundColor: config.color,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                                shadowColor: config.color,
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.3,
                                shadowRadius: 16,
                                elevation: 8,
                            }}
                        >
                            <Ionicons name={config.icon} size={40} color="white" />
                        </View>
                        <Text
                            style={{
                                fontSize: 32,
                                fontWeight: "bold",
                                color: config.color,
                                fontFamily: "PublicSans-Bold",
                            }}
                        >
                            {config.title}
                        </Text>
                        <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginTop: 4, fontFamily: "PublicSans-Regular" }}>{config.subtitle}</Text>
                    </View>

                    {/* Form */}
                    <View style={{ gap: 16 }}>
                        <View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: "500",
                                    color: COLORS.text,
                                    marginBottom: 8,
                                    fontFamily: "PublicSans-Medium",
                                }}
                            >
                                Email
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
                                    <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                                </View>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        paddingHorizontal: 12,
                                        paddingVertical: 14,
                                        fontSize: 16,
                                        fontFamily: "PublicSans-Regular",
                                    }}
                                    placeholder="email@example.com"
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
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: "500",
                                    color: COLORS.text,
                                    marginBottom: 8,
                                    fontFamily: "PublicSans-Medium",
                                }}
                            >
                                Password
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
                                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                                </View>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        paddingHorizontal: 12,
                                        paddingVertical: 14,
                                        fontSize: 16,
                                        color: COLORS.text,
                                        fontFamily: "PublicSans-Regular",
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 14, paddingVertical: 14 }}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Link href="/(auth)/forgot-password" asChild>
                            <TouchableOpacity style={{ alignSelf: "flex-end" }}>
                                <Text style={{ color: config.color, fontSize: 14, fontFamily: "PublicSans-Medium" }}>Lupa password?</Text>
                            </TouchableOpacity>
                        </Link>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            style={{
                                backgroundColor: config.color,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                marginTop: 8,
                                opacity: isLoading ? 0.7 : 1,
                                shadowColor: config.color,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Masuk</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    {config.showRegister && (
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "center",
                                marginTop: 32,
                                gap: 4,
                            }}
                        >
                            <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>Belum punya akun?</Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text style={{ color: config.color, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Daftar</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
