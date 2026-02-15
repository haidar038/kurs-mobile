import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Facility {
    id: string;
    name: string;
    address: string | null;
}

export default function RegisterStaffScreen() {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase.from("facilities").select("id, name, address").eq("type", "waste_bank").order("name");

            if (error) throw error;
            setFacilities(data || []);
        } catch (error) {
            console.error("Error fetching facilities:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFacility) {
            Alert.alert("Error", "Mohon pilih Bank Sampah tempat Anda bertugas.");
            return;
        }

        setIsLoading(true);

        try {
            // Insert into role_applications table
            const { error } = await supabase.from("role_applications").insert({
                user_id: user?.id,
                requested_role: "waste_bank_staff",
                status: "pending",
                metadata: {
                    facility_id: selectedFacility,
                    facility_name: facilities.find((f) => f.id === selectedFacility)?.name,
                },
            });

            if (error) throw error;

            Alert.alert("Pendaftaran Dikirim", "Permohonan Anda sebagai Staff Bank Sampah telah dikirim. Mohon tunggu verifikasi dari Admin.", [
                {
                    text: "OK",
                    onPress: () => {
                        refreshProfile();
                        router.back();
                    },
                },
            ]);
        } catch (error: any) {
            Alert.alert("Gagal Mengirim Pendaftaran", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>Daftar Staff Bank Sampah</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 24, fontFamily: "PublicSans-Regular" }}>
                    Bergabunglah sebagai Staff Bank Sampah untuk membantu mengelola operasional dan setoran di lingkungan Anda. Silakan pilih Bank Sampah tempat Anda bertugas.
                </Text>

                {isFetching ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                    <View style={{ gap: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text, marginBottom: 8, fontFamily: "PublicSans-Medium" }}>Pilih Bank Sampah</Text>

                        {facilities.map((facility) => (
                            <TouchableOpacity
                                key={facility.id}
                                onPress={() => setSelectedFacility(facility.id)}
                                style={{
                                    backgroundColor: COLORS.surface,
                                    borderWidth: 2,
                                    borderColor: selectedFacility === facility.id ? COLORS.primary : COLORS.border,
                                    borderRadius: 12,
                                    padding: 16,
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text, fontFamily: "PublicSans-Bold" }}>{facility.name}</Text>
                                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontFamily: "PublicSans-Regular" }}>{facility.address}</Text>
                                </View>
                                {selectedFacility === facility.id && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading || !selectedFacility}
                            style={{
                                backgroundColor: COLORS.primary,
                                paddingVertical: 16,
                                borderRadius: 12,
                                alignItems: "center",
                                marginTop: 24,
                                opacity: isLoading || !selectedFacility ? 0.7 : 1,
                            }}
                        >
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", fontFamily: "PublicSans-SemiBold" }}>Kirim Pendaftaran</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
