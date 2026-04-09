import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
    const router = useRouter();

    const Section = ({ title, content }: { title: string; content: string }) => (
        <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Bold" }}>{title}</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, fontFamily: "PublicSans-Regular" }}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Kebijakan Privasi</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Bold" }}>Kebijakan Privasi KURS</Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 32, fontFamily: "PublicSans-Regular" }}>Terakhir diperbarui: 16 Februari 2026</Text>

                <Section
                    title="1. Informasi yang Kami Kumpulkan"
                    content="Kami mengumpulkan informasi pribadi yang Anda berikan saat mendaftar, seperti nama, alamat email, nomor telepon, dan data lokasi GPS untuk keperluan penjemputan sampah."
                />

                <Section title="2. Penggunaan Informasi" content="Informasi Anda digunakan untuk menyediakan layanan penjemputan sampah, memproses pembayaran, berkomunikasi dengan Anda, dan meningkatkan kualitas layanan kami." />

                <Section
                    title="3. Berbagi Informasi"
                    content="Data lokasi dan detail kontak Anda dibagikan kepada Mitra (Collector) yang bertugas menjemput sampah Anda. Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran."
                />

                <Section title="4. Keamanan Data" content="Kami mengimplementasikan langkah-langkah keamanan teknis yang wajar untuk melindungi informasi pribadi Anda dari akses atau pengungkapan yang tidak sah." />

                <Section title="5. Hak Anda" content="Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan informasi pribadi Anda melalui pengaturan profil di aplikasi atau dengan menghubungi tim support kami." />

                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 16, marginBottom: 40, textAlign: "center", fontFamily: "PublicSans-Regular" }}>
                    Privasi Anda sangat penting bagi kami. Terima kasih telah mempercayai KURS.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
