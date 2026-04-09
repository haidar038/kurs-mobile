import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
    const router = useRouter();
    const { session, hasRole } = useAuth();

    // Floating animation for logo
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(withSequence(withTiming(-10, { duration: 2500 }), withTiming(0, { duration: 2500 })), -1, true);
    }, [translateY]);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleBuangSampah = () => {
        if (session) {
            router.replace("/(app)/(tabs)/home");
        } else {
            router.push({ pathname: "/(auth)/login", params: { type: "user" } });
        }
    };

    const handleJadiMitra = () => {
        if (session) {
            if (hasRole("collector")) {
                router.replace("/(collector)/(tabs)/dashboard");
            } else {
                router.push("/(app)/profile/register-partner" as any);
            }
        } else {
            router.push({ pathname: "/(auth)/login", params: { type: "collector" } });
        }
    };

    const handleStaffBank = () => {
        if (session) {
            if (hasRole("waste_bank_staff")) {
                router.replace("/(waste-bank)/(tabs)" as any);
            } else {
                router.push("/(app)/profile/register-staff" as any);
            }
        } else {
            router.push({ pathname: "/(auth)/login", params: { type: "staff" } });
        }
    };

    const RoleCard = ({ title, description, icon, color, onPress, delay = 0 }: { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void; delay?: number }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                backgroundColor: COLORS.surface,
                borderRadius: 24,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: COLORS.border,
            }}
        >
            <View
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: color + "10",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: color + "20",
                }}
            >
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>{title}</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontFamily: "PublicSans-Regular", lineHeight: 18 }}>{description}</Text>
            </View>
            <View
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: COLORS.background,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: COLORS.border,
                }}
            >
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <LinearGradient colors={[COLORS.primaryLight + "40", COLORS.background]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400 }} />

            {/* Decorative Background Circles */}
            <View style={{ position: "absolute", top: -50, right: -50, width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: COLORS.primary + "08" }} />
            <View style={{ position: "absolute", top: 20, right: -80, width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: COLORS.primary + "05" }} />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={{ alignItems: "center", marginBottom: 48 }}>
                        <Animated.View style={[animatedLogoStyle]}>
                            <View
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 32,
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 20,
                                    elevation: 8,
                                    position: "relative",
                                    backgroundColor: COLORS.surface, // Background for the shadow to pop if SVG is transparent-ish
                                }}
                            >
                                <Image source={require("../../assets/images/jgbm-secondary.svg")} style={{ width: "100%", height: "100%", borderRadius: 32 }} contentFit="contain" />
                            </View>
                        </Animated.View>

                        <Text
                            style={{
                                fontSize: 34,
                                fontWeight: "900",
                                color: COLORS.text,
                                fontFamily: "PublicSans-Bold",
                                marginTop: 16,
                                letterSpacing: -1,
                            }}
                        >
                            Halo, Warga Bumi! 👋
                        </Text>
                        <Text
                            style={{
                                fontSize: 15,
                                color: COLORS.textSecondary,
                                marginTop: 10,
                                textAlign: "center",
                                fontFamily: "PublicSans-Regular",
                                lineHeight: 22,
                                paddingHorizontal: 20,
                            }}
                        >
                            Pilih peran kamu untuk mulai menyelamatkan lingkungan hari ini.
                        </Text>
                    </View>

                    {/* Role Options */}
                    <RoleCard title="Warga" description="Setor sampah, dapat poin & reward menarik" icon="trash" color="#10B981" onPress={handleBuangSampah} />

                    <RoleCard title="Mitra Driver" description="Jemput sampah warga & kelola armada" icon="car" color="#3B82F6" onPress={handleJadiMitra} />

                    <RoleCard title="Staff Bank Sampah" description="Kelola operasional & validasi setoran" icon="business" color="#8B5CF6" onPress={handleStaffBank} />

                    {/* Footer */}
                    <View
                        style={{
                            alignItems: "center",
                            marginTop: 24,
                            paddingBottom: 20,
                        }}
                    >
                        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                            <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", fontSize: 16 }}>Belum punya akun?</Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text
                                        style={{
                                            color: COLORS.primary,
                                            fontWeight: "800",
                                            fontFamily: "PublicSans-Bold",
                                            fontSize: 16,
                                            textDecorationLine: "underline",
                                            textDecorationColor: COLORS.lime,
                                        }}
                                    >
                                        Daftar Sekarang
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        <View style={{ marginTop: 40, alignItems: "center", opacity: 0.4 }}>
                            <View style={{ width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 12 }} />
                            <Text
                                style={{
                                    fontSize: 10,
                                    color: COLORS.textSecondary,
                                    fontFamily: "PublicSans-Medium",
                                    letterSpacing: 3,
                                    textTransform: "uppercase",
                                }}
                            >
                                Jaga Bumi v1.0
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
