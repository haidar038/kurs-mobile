import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { profile, user, signOut, switchRole, hasRole } = useAuth();
    const router = useRouter();
    const [partnerStatus, setPartnerStatus] = useState<"none" | "pending" | "approved">("none");
    const [staffStatus, setStaffStatus] = useState<"none" | "pending" | "approved">("none");

    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle("light");
            return () => {
                setStatusBarStyle("dark");
            };
        }, []),
    );

    useFocusEffect(
        useCallback(() => {
            const checkPartnerStatus = async () => {
                if (!user) return;
                if (hasRole("collector")) {
                    setPartnerStatus("approved");
                    return;
                }
                const { data } = await supabase.from("role_applications").select("id").eq("user_id", user.id).eq("requested_role", "collector").eq("status", "pending").maybeSingle();
                setPartnerStatus(data ? "pending" : "none");
            };

            const checkStaffStatus = async () => {
                if (!user) return;
                if (hasRole("waste_bank_staff")) {
                    setStaffStatus("approved");
                    return;
                }
                const { data } = await supabase.from("role_applications").select("id").eq("user_id", user.id).eq("requested_role", "waste_bank_staff").eq("status", "pending").maybeSingle();
                setStaffStatus(data ? "pending" : "none");
            };

            checkPartnerStatus();
            checkStaffStatus();
        }, [user, hasRole]),
    );

    const handleSignOut = () => {
        if (Platform.OS === "web") {
            if (window.confirm("Yakin ingin keluar dari akun?")) signOut();
        } else {
            Alert.alert("Keluar", "Yakin ingin keluar dari akun?", [
                { text: "Batal", style: "cancel" },
                { text: "Keluar", style: "destructive", onPress: signOut },
            ]);
        }
    };

    const SettingItem = ({
        icon,
        label,
        onPress,
        isLast = false,
        iconBg = COLORS.primaryLight,
        iconColor = COLORS.primary,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        onPress: () => void;
        isLast?: boolean;
        iconBg?: string;
        iconColor?: string;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: COLORS.border,
            }}
        >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, fontFamily: "PublicSans-SemiBold", color: COLORS.text }}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    const handleUpgradeRole = () => {
        if (partnerStatus === "none" && staffStatus === "none") {
            Alert.alert("Gabung Bersama KURS", "Pilih peran yang ingin kamu ajukan:", [
                { text: "Mitra Kolektor", onPress: () => router.push("/(app)/profile/register-partner" as any) },
                { text: "Staff Bank Sampah", onPress: () => router.push("/(app)/profile/register-staff" as any) },
                { text: "Batal", style: "cancel" },
            ]);
        } else if (partnerStatus === "none") {
            router.push("/(app)/profile/register-partner" as any);
        } else if (staffStatus === "none") {
            router.push("/(app)/profile/register-staff" as any);
        }
    };

    const renderHeader = () => (
        <View style={{ paddingBottom: 24, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, backgroundColor: COLORS.primary }}>
            <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                <Text style={{ textAlign: "center", color: "white", fontSize: 18, fontFamily: "PublicSans-Bold" }}>Profil Saya</Text>
            </SafeAreaView>

            <View style={{ alignItems: "center", marginTop: 20 }}>
                <View style={{ position: "relative" }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "white", padding: 4 }}>
                        <View style={{ width: "100%", height: "100%", borderRadius: 46, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 36, fontFamily: "PublicSans-Bold", color: COLORS.primary }}>{profile?.full_name?.charAt(0).toUpperCase() || "U"}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.6}
                        style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.lime, borderWidth: 1, borderColor: "white", alignItems: "center", justifyContent: "center" }}
                    >
                        <Ionicons name="pencil" size={14} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 22, fontFamily: "PublicSans-Bold", color: "white", marginTop: 12 }}>{profile?.full_name || "Nama Pengguna"}</Text>
                <Text style={{ fontSize: 14, fontFamily: "PublicSans-Medium", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{user?.email}</Text>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.2)",
                    }}
                >
                    <Ionicons name="shield-checkmark" size={14} color="white" />
                    <Text style={{ fontSize: 12, fontFamily: "PublicSans-Bold", color: "white" }}>{profile?.role === "user" ? "Warga" : profile?.role?.replace("_", " ").toUpperCase()} • Level 1</Text>
                </View>
            </View>
        </View>
    );

    const renderModeSwitchers = () => (
        <View style={{ gap: 12, marginBottom: 24 }}>
            {partnerStatus === "approved" && (
                <TouchableOpacity
                    onPress={() => {
                        switchRole("collector");
                        router.replace("/(collector)/(tabs)/dashboard" as any);
                    }}
                    style={{
                        backgroundColor: COLORS.secondary,
                        padding: 16,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        elevation: 4,
                        shadowColor: COLORS.secondary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                    }}
                >
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="bicycle" size={24} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: "white", fontSize: 14, fontFamily: "PublicSans-Bold" }}>Mode Kolektor</Text>
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "PublicSans-Medium" }}>Ganti peran ke kolektor sampah</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                </TouchableOpacity>
            )}

            {staffStatus === "approved" && (
                <TouchableOpacity
                    onPress={() => {
                        switchRole("waste_bank_staff");
                        router.replace("/(waste-bank)/(tabs)" as any);
                    }}
                    style={{
                        backgroundColor: COLORS.primary,
                        padding: 16,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        elevation: 4,
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                    }}
                >
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="business" size={24} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: "white", fontSize: 14, fontFamily: "PublicSans-Bold" }}>Mode Staff TPS</Text>
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "PublicSans-Medium" }}>Ganti peran ke staff bank sampah</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderUpgradeBanner = () => (
        <TouchableOpacity onPress={handleUpgradeRole}>
            <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                style={{
                    borderRadius: 24,
                    padding: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    elevation: 8,
                    shadowColor: "#3B82F6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontSize: 16, fontFamily: "PublicSans-Bold", marginBottom: 4 }}>Gabung Mitra / Staff</Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "PublicSans-Medium", lineHeight: 16 }}>Dapatkan penghasilan tambahan dengan jadi kolektor atau pengelola sampah.</Text>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, backgroundColor: "#F9FAFB", minHeight: "100%" }}>
                {renderHeader()}

                {/* Role Actions Section */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                    {(partnerStatus === "approved" || staffStatus === "approved") && renderModeSwitchers()}
                    {(partnerStatus !== "approved" || staffStatus !== "approved") && renderUpgradeBanner()}
                </View>

                {/* Settings Section: Akun */}
                <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                    <Text style={{ fontSize: 12, fontFamily: "PublicSans-Bold", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginLeft: 8, marginBottom: 12 }}>Pengaturan Akun</Text>
                    <View style={{ backgroundColor: "white", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border }}>
                        <SettingItem icon="person-outline" label="Data Personal" onPress={() => router.push("/(app)/profile/edit" as any)} />
                        <SettingItem icon="call-outline" label="Nomor Handphone" onPress={() => router.push("/(app)/profile/change-phone" as any)} />
                        <SettingItem icon="lock-closed-outline" label="Keamanan" onPress={() => router.push("/(app)/profile/change-password" as any)} isLast />
                    </View>
                </View>

                {/* Settings Section: Info */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                    <Text style={{ fontSize: 12, fontFamily: "PublicSans-Bold", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginLeft: 8, marginBottom: 12 }}>Pusat Bantuan</Text>
                    <View style={{ backgroundColor: "white", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border }}>
                        <SettingItem icon="help-circle-outline" label="Bantuan & CS" onPress={() => router.push("/(app)/profile/help" as any)} iconBg="#F3F4F6" iconColor="#6B7280" />
                        <SettingItem icon="document-text-outline" label="Syarat & Ketentuan" onPress={() => router.push("/(app)/profile/terms" as any)} iconBg="#F3F4F6" iconColor="#6B7280" />
                        <SettingItem icon="shield-checkmark-outline" label="Kebijakan Privasi" onPress={() => router.push("/(app)/profile/privacy" as any)} iconBg="#F3F4F6" iconColor="#6B7280" isLast />
                    </View>
                </View>

                {/* Logout Button */}
                <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        style={{
                            paddingVertical: 14,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: "#FEE2E2",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            backgroundColor: "#FFF1F1",
                        }}
                    >
                        <Ionicons name="log-out" size={20} color={COLORS.error} />
                        <Text style={{ fontSize: 14, fontFamily: "PublicSans-Bold", color: COLORS.error }}>Keluar Akun</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ textAlign: "center", fontSize: 10, fontFamily: "PublicSans-Medium", color: COLORS.textSecondary, marginTop: 32 }}>KURS v1.0.0 (Build 402)</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
