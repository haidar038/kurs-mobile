import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WasteBankProfileScreen() {
    const { profile, user, signOut, switchRole } = useAuth();
    const router = useRouter();

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
                        <Text style={{ fontSize: 32, fontWeight: "bold", color: COLORS.primary }}>{profile?.full_name?.charAt(0).toUpperCase() || "S"}</Text>
                    </View>
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: COLORS.text,
                            marginTop: 16,
                            fontFamily: "GoogleSans-Bold",
                        }}
                    >
                        {profile?.full_name || "Nama Pengguna"}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>{user?.email}</Text>
                    <View
                        style={{
                            backgroundColor: COLORS.secondary + "20",
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginTop: 12,
                        }}
                    >
                        <Text style={{ fontSize: 12, color: COLORS.secondary, fontWeight: "600", textTransform: "uppercase" }}>{profile?.role || "STAFF"}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={{ paddingBottom: 24 }}>
                    {/* Switch Role Button */}
                    <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
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
                            }}
                        >
                            <Ionicons name="person" size={20} color={COLORS.primary} />
                            <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "600" }}>Masuk Mode Pengguna</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <View style={{ marginTop: 20 }}>
                        <MenuItem icon="business-outline" label="Informasi Fasilitas" onPress={() => {}} />
                        <MenuItem icon="settings-outline" label="Pengaturan" onPress={() => {}} />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <MenuItem icon="help-circle-outline" label="Bantuan" onPress={() => {}} />
                        <MenuItem icon="document-text-outline" label="Syarat & Ketentuan" onPress={() => {}} />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <MenuItem icon="log-out-outline" label="Keluar" onPress={handleSignOut} danger />
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
