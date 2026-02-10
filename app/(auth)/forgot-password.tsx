import { supabase } from "@/lib/supabase";
import { COLORS } from "@/utils/constants";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert("Error", "Masukkan email");
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: "kurs://reset-password",
        });
        setIsLoading(false);

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            setIsSent(true);
        }
    };

    if (isSent) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 24,
                    backgroundColor: COLORS.background,
                }}
            >
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📧</Text>
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: COLORS.text,
                        textAlign: "center",
                    }}
                >
                    Cek Email Anda
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: COLORS.textSecondary,
                        textAlign: "center",
                        marginTop: 12,
                        lineHeight: 24,
                    }}
                >
                    Kami telah mengirim link reset password ke {email}
                </Text>
                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingVertical: 14,
                            paddingHorizontal: 32,
                            borderRadius: 12,
                            marginTop: 32,
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Kembali ke Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        );
    }

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
                {/* Header */}
                <View style={{ alignItems: "center", marginBottom: 40 }}>
                    <Text
                        style={{
                            fontSize: 32,
                            fontWeight: "bold",
                            color: COLORS.text,
                        }}
                    >
                        Lupa Password
                    </Text>
                    <Text
                        style={{
                            fontSize: 16,
                            color: COLORS.textSecondary,
                            marginTop: 8,
                            textAlign: "center",
                        }}
                    >
                        Masukkan email untuk reset password
                    </Text>
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
                            }}
                        >
                            Email
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: COLORS.surface,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                fontSize: 16,
                            }}
                            placeholder="email@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleReset}
                        disabled={isLoading}
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: "center",
                            marginTop: 8,
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Kirim Link Reset</Text>}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity style={{ alignItems: "center", marginTop: 32 }}>
                        <Text style={{ color: COLORS.primary, fontWeight: "600" }}>← Kembali ke Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </KeyboardAvoidingView>
    );
}
