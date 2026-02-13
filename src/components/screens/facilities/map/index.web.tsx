import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FacilitiesMapScreenWeb() {
    const router = useRouter();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase.from("facilities").select("*");
            if (error) throw error;
            setFacilities(data as any);
        } catch (error) {
            console.error("Error fetching facilities:", error);
            Alert.alert("Error", "Gagal memuat data fasilitas");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daftar Fasilitas</Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <Text style={{ textAlign: "center", color: COLORS.textSecondary, marginBottom: 20 }}>Tampilan peta lebih optimal di aplikasi mobile. Berikut daftar fasilitas tersedia:</Text>
                        {facilities.map((facility) => (
                            <TouchableOpacity
                                key={facility.id}
                                style={styles.card}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(app)/facilities/[id]",
                                        params: { id: facility.id },
                                    })
                                }
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                    <View style={[styles.dot, { backgroundColor: facility.type === "waste_bank" ? COLORS.success : COLORS.error }]} />
                                    <Text style={styles.cardTitle}>{facility.name}</Text>
                                </View>
                                <Text style={styles.cardAddress}>{facility.address}</Text>
                                <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "flex-end" }}>
                                    <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "600" }}>Lihat Detail</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.text,
        marginLeft: 8,
    },
    cardAddress: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
