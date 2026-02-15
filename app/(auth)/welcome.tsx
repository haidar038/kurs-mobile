import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
    const router = useRouter();
    const { session, hasRole } = useAuth();

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

    const RoleCard = ({ title, description, icon, color, onPress }: { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 24,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
            }}
        >
            <View
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    backgroundColor: color + "15",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={30} color={color} />
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>{title}</Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4, fontFamily: "PublicSans-Regular" }}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                {/* Header */}
                <View style={{ alignItems: "center", marginTop: 20, marginBottom: 40 }}>
                    <View
                        style={{
                            width: 70,
                            height: 70,
                            borderRadius: 20,
                            backgroundColor: COLORS.primary,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        <Ionicons name="leaf" size={35} color="white" />
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: "bold", color: COLORS.primary, fontFamily: "PublicSans-Bold" }}>KURS</Text>
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 8, textAlign: "center", fontFamily: "PublicSans-Regular" }}>Pilih peran Anda untuk melanjutkan</Text>
                </View>

                {/* Role Options */}
                <RoleCard title="Buang Sampah" description="Saya ingin membuang sampah dan mendapatkan poin" icon="trash-outline" color="#10B981" onPress={handleBuangSampah} />

                <RoleCard title="Jadi Mitra" description="Saya ingin menjemput sampah sebagai mitra driver" icon="bicycle-outline" color="#3B82F6" onPress={handleJadiMitra} />

                <RoleCard title="Staff Bank Sampah" description="Kelola operasional dan setoran di bank sampah" icon="business-outline" color="#8B5CF6" onPress={handleStaffBank} />

                {/* Footer */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        marginTop: 16,
                        gap: 4,
                    }}
                >
                    <Text style={{ color: COLORS.textSecondary, fontFamily: "PublicSans-Regular", fontSize: 16 }}>Belum punya akun?</Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={{ color: COLORS.primary, fontWeight: "600", fontFamily: "PublicSans-SemiBold", fontSize: 16 }}>Daftar</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
