import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
            const checkPartnerStatus = async () => {
                if (!user) return;

                // If already collector, status is approved
                if (hasRole("collector")) {
                    setPartnerStatus("approved");
                    return;
                }

                const { data } = await supabase.from("role_applications").select("id").eq("user_id", user.id).eq("requested_role", "collector").eq("status", "pending").maybeSingle();

                if (data) {
                    setPartnerStatus("pending");
                } else {
                    setPartnerStatus("none");
                }
            };

            const checkStaffStatus = async () => {
                if (!user) return;

                if (hasRole("waste_bank_staff")) {
                    setStaffStatus("approved");
                    return;
                }

                const { data } = await supabase.from("role_applications").select("id").eq("user_id", user.id).eq("requested_role", "waste_bank_staff").eq("status", "pending").maybeSingle();

                if (data) {
                    setStaffStatus("pending");
                } else {
                    setStaffStatus("none");
                }
            };

            checkPartnerStatus();
            checkStaffStatus();
        }, [user, hasRole]),
    );

    const handleSignOut = () => {
        if (Platform.OS === "web") {
            const confirm = window.confirm("Yakin ingin keluar dari akun?");
            if (confirm) {
                signOut();
            }
        } else {
            Alert.alert("Keluar", "Yakin ingin keluar dari akun?", [
                { text: "Batal", style: "cancel" },
                {
                    text: "Keluar",
                    style: "destructive",
                    onPress: signOut,
                },
            ]);
        }
    };

    const MenuItem = ({ icon, label, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: COLORS.surface,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
            }}
        >
            <Ionicons name={icon} size={22} color={danger ? COLORS.error : COLORS.textSecondary} />
            <Text
                style={{
                    flex: 1,
                    marginLeft: 16,
                    fontSize: 16,
                    color: danger ? COLORS.error : COLORS.text,
                }}
            >
                {label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView>
                {/* Header Profile */}
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        padding: 24,
                        alignItems: "center",
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                    }}
                >
                    <View
                        style={{
                            width: 80,
                            height: 80,
                            backgroundColor: COLORS.primary + "20",
                            borderRadius: 40,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ fontSize: 32, fontWeight: "bold", color: COLORS.primary }}>{profile?.full_name?.charAt(0).toUpperCase() || "U"}</Text>
                    </View>
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: COLORS.text,
                            marginTop: 16,
                        }}
                    >
                        {profile?.full_name || "Nama Pengguna"}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>{user?.email}</Text>
                    <View
                        style={{
                            backgroundColor: COLORS.primary + "20",
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginTop: 12,
                        }}
                    >
                        <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "600" }}>{profile?.role?.toUpperCase() || "USER"}</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={{ marginTop: 20 }}>
                    <MenuItem icon="person-outline" label="Edit Profil" onPress={() => {}} />
                    <MenuItem icon="call-outline" label="Ubah Nomor HP" onPress={() => {}} />
                    <MenuItem icon="lock-closed-outline" label="Ubah Password" onPress={() => {}} />
                </View>

                <View style={{ marginTop: 20 }}>
                    <MenuItem icon="help-circle-outline" label="Bantuan" onPress={() => {}} />
                    <MenuItem icon="document-text-outline" label="Syarat & Ketentuan" onPress={() => {}} />
                    <MenuItem icon="shield-checkmark-outline" label="Kebijakan Privasi" onPress={() => {}} />
                </View>

                <View style={{ marginTop: 20 }}>
                    <MenuItem icon="log-out-outline" label="Keluar" onPress={handleSignOut} danger />
                </View>

                {/* Partner Section */}
                <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
                    {hasRole("collector") ? (
                        <TouchableOpacity
                            onPress={() => {
                                switchRole("collector");
                                router.replace("/(collector)/(tabs)/dashboard" as any);
                            }}
                            style={{
                                backgroundColor: COLORS.secondary,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            <Ionicons name="bicycle" size={24} color="white" />
                            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", fontFamily: "PublicSans-Bold" }}>Masuk Mode Mitra</Text>
                        </TouchableOpacity>
                    ) : partnerStatus === "pending" ? (
                        <View
                            style={{
                                backgroundColor: COLORS.surface,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                        >
                            <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>Pendaftaran Mitra Sedang Diproses</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/profile/register-partner" as any)}
                            style={{
                                backgroundColor: COLORS.surface,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: COLORS.primary,
                            }}
                        >
                            <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Daftar Jadi Mitra</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Staff Section */}
                <View style={{ marginTop: 12, paddingHorizontal: 20 }}>
                    {hasRole("waste_bank_staff") ? (
                        <TouchableOpacity
                            onPress={() => {
                                switchRole("waste_bank_staff");
                                router.replace("/(waste-bank)/(tabs)" as any);
                            }}
                            style={{
                                backgroundColor: COLORS.primary,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            <Ionicons name="business" size={24} color="white" />
                            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", fontFamily: "PublicSans-Bold" }}>Masuk Mode Staff</Text>
                        </TouchableOpacity>
                    ) : staffStatus === "pending" ? (
                        <View
                            style={{
                                backgroundColor: COLORS.surface,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                        >
                            <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular" }}>Pendaftaran Staff Sedang Diproses</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/profile/register-staff" as any)}
                            style={{
                                backgroundColor: COLORS.surface,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: COLORS.secondary,
                            }}
                        >
                            <Text style={{ color: COLORS.secondary, fontSize: 16, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Daftar Jadi Staff Bank Sampah</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text
                    style={{
                        textAlign: "center",
                        fontSize: 12,
                        color: COLORS.textSecondary,
                        marginTop: 32,
                        marginBottom: 24,
                    }}
                >
                    KURS v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
