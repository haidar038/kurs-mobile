import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WasteBankProfileScreen() {
    const { profile, user, signOut, switchRole } = useAuth();
    const router = useRouter();

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
                <View style={{ padding: 24 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 24, fontFamily: "GoogleSans-Bold" }}>Profil Staff</Text>

                    <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.primary }}>{profile?.full_name?.charAt(0) || "S"}</Text>
                            </View>
                            <View style={{ marginLeft: 16 }}>
                                <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, fontFamily: "GoogleSans-Bold" }}>{profile?.full_name || "Staff Waste Bank"}</Text>
                                <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{user?.email}</Text>
                                <View style={{ backgroundColor: COLORS.secondary + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start", marginTop: 4 }}>
                                    <Text style={{ fontSize: 12, color: COLORS.secondary, textTransform: "capitalize" }}>{profile?.role}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Switch Role Button */}
                    <TouchableOpacity
                        onPress={() => {
                            switchRole("user");
                            router.replace("/(tabs)/home" as any);
                        }}
                        style={{
                            backgroundColor: COLORS.surface,
                            padding: 16,
                            borderRadius: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: COLORS.primary,
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 8,
                            marginBottom: 24,
                        }}
                    >
                        <Ionicons name="person" size={20} color={COLORS.primary} />
                        <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "600" }}>Masuk Mode Pengguna</Text>
                    </TouchableOpacity>

                    {/* Menu Items */}
                    <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
                        <MenuItem icon="business-outline" label="Informasi Fasilitas" onPress={() => {}} />
                        <MenuItem icon="settings-outline" label="Pengaturan" onPress={() => {}} />
                    </View>

                    <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
                        <MenuItem icon="help-circle-outline" label="Bantuan" onPress={() => {}} />
                        <MenuItem icon="document-text-outline" label="Syarat & Ketentuan" onPress={() => {}} />
                    </View>

                    <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, overflow: "hidden" }}>
                        <MenuItem icon="log-out-outline" label="Keluar" onPress={signOut} danger />
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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
