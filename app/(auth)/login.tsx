import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, switchRole } = useAuth();
    const router = useRouter();

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
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();

            setIsLoading(false);

            if (profile?.role === "collector") {
                Alert.alert("Pilih Mode Masuk", "Anda terdaftar sebagai Mitra. Ingin masuk sebagai?", [
                    {
                        text: "Pengguna (User)",
                        onPress: () => {
                            switchRole("user");
                            router.replace("/(tabs)/home" as any);
                        },
                    },
                    {
                        text: "Mitra (Driver)",
                        onPress: () => {
                            switchRole("collector");
                            router.replace("/(collector)/dashboard" as any);
                        },
                    },
                ]);
            } else if (profile?.role === "admin") {
                // For now redirect admin to user home, or web dashboard if we had one
                switchRole("user");
                router.replace("/(tabs)/home" as any);
            } else {
                // Default user
                switchRole("user");
                router.replace("/(tabs)/home" as any);
            }
        } else {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    backgroundColor: COLORS.background,
                }}
            >
                {/* Logo */}
                <View style={{ alignItems: "center", marginBottom: 48 }}>
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 24,
                            backgroundColor: COLORS.primary,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 16,
                            elevation: 8,
                        }}
                    >
                        <Ionicons name="leaf" size={40} color="white" />
                    </View>
                    <Text
                        style={{
                            fontSize: 36,
                            fontWeight: "bold",
                            color: COLORS.primary,
                            fontFamily: "GoogleSans-Bold",
                        }}
                    >
                        KURS
                    </Text>
                    <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginTop: 4, fontFamily: "GoogleSans-Regular" }}>Kurir Sampah</Text>
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
                                fontFamily: "GoogleSans-Medium",
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
                                    fontFamily: "GoogleSans-Regular",
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
                                fontFamily: "GoogleSans-Medium",
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
                                    fontFamily: "GoogleSans-Regular",
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
                            <Text style={{ color: COLORS.primary, fontSize: 14, fontFamily: "GoogleSans-Medium" }}>Lupa password?</Text>
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity
                        onPress={handleLogin}
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
                        {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "GoogleSans-SemiBold" }}>Masuk</Text>}
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
                    <Text style={{ color: COLORS.textSecondary, fontFamily: "GoogleSans-Regular" }}>Belum punya akun?</Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={{ color: COLORS.primary, fontWeight: "600", fontFamily: "GoogleSans-SemiBold" }}>Daftar</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
