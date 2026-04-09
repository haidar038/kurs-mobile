import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
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
                <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Syarat & Ketentuan</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Bold" }}>Syarat & Ketentuan Penggunaan</Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 32, fontFamily: "PublicSans-Regular" }}>Terakhir diperbarui: 16 Februari 2026</Text>

                <Section
                    title="1. Penerimaan Ketentuan"
                    content="Dengan mengakses dan menggunakan aplikasi KURS, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperbolehkan menggunakan layanan kami."
                />

                <Section
                    title="2. Layanan KURS"
                    content="KURS menyediakan platform yang menghubungkan warga (User) dengan pengumpul sampah (Mitra/Collector) dan fasilitas pengolahan sampah (Bank Sampah). KURS bertindak sebagai penyedia platform dan tidak bertanggung jawab langsung atas interaksi fisik antara pengguna."
                />

                <Section
                    title="3. Akun Pengguna"
                    content="Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda. Anda setuju untuk memberikan informasi yang akurat dan lengkap saat mendaftar dan memperbarui profil Anda."
                />

                <Section
                    title="4. Biaya dan Pembayaran"
                    content="Biaya layanan pickup ditentukan berdasarkan estimasi volume dan jenis sampah. Pembayaran dilakukan melalui metode yang tersedia di aplikasi. KURS berhak mengubah skema biaya sewaktu-waktu dengan pemberitahuan sebelumnya."
                />

                <Section title="5. Batasan Tanggung Jawab" content="KURS tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami." />

                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 16, marginBottom: 40, textAlign: "center", fontFamily: "PublicSans-Regular" }}>© 2026 KURS Indonesia. Seluruh hak cipta dilindungi undang-undang.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
