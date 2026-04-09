import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpScreen() {
    const router = useRouter();

    const HelpItem = ({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) => (
        <View style={{ flexDirection: "row", gap: 16, backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + "10", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon} size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text, fontFamily: "PublicSans-SemiBold" }}>{title}</Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 2, fontFamily: "PublicSans-Regular" }}>{description}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Bantuan</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 16, fontFamily: "PublicSans-Bold" }}>Pusat Bantuan KURS</Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20, fontFamily: "PublicSans-Regular" }}>
                    Butuh bantuan? Kami siap membantu Anda. Berikut adalah beberapa cara untuk mendapatkan informasi atau bantuan terkait layanan KURS.
                </Text>

                <HelpItem icon="call-outline" title="Hubungi Kami" description="Layanan pelanggan tersedia 24/7 di nomor +62 812 3456 7890" />
                <HelpItem icon="mail-outline" title="Email" description="Kirimkan pertanyaan Anda ke bantuan@kurs.id" />
                <HelpItem icon="chatbubble-ellipses-outline" title="Live Chat" description="Ngobrol langsung dengan tim support kami di aplikasi" />
                <HelpItem icon="book-outline" title="Panduan Pengguna" description="Pelajari cara menggunakan aplikasi KURS dengan lengkap" />

                <TouchableOpacity
                    style={{
                        marginTop: 24,
                        backgroundColor: COLORS.primary,
                        padding: 16,
                        borderRadius: 12,
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 16, fontFamily: "PublicSans-SemiBold" }}>Hubungi Admin</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
