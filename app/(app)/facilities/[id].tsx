import { supabase } from "@/lib/supabase";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface OpeningHours {
    open: string;
    close: string;
    closed: boolean;
}

interface Facility {
    id: string;
    name: string;
    type: "tps" | "waste_bank";
    address: string | null;
    location: { latitude: number; longitude: number } | null;
    contact: string | null;
    opening_hours: Record<string, OpeningHours> | null;
}

const FACILITY_TYPES = {
    tps: { label: "TPS", icon: "trash-bin", color: "#EF4444" },
    waste_bank: { label: "Bank Sampah", icon: "leaf", color: "#10B981" },
} as const;

export default function FacilityDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [facility, setFacility] = useState<Facility | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) fetchFacility();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchFacility = async () => {
        try {
            const { data, error } = await supabase.from("facilities").select("*").eq("id", id).single();

            if (error) throw error;

            const formattedData = {
                ...data,
                location:
                    data.location && typeof data.location === "object"
                        ? {
                              latitude: (data.location as any).lat,
                              longitude: (data.location as any).lng,
                          }
                        : null,
            };

            setFacility(formattedData as Facility);
        } catch (error) {
            console.error("Fetch facility error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openMaps = () => {
        if (!facility?.location) return;

        const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
        Linking.openURL(url);
    };

    const callContact = () => {
        if (!facility?.contact) return;
        Linking.openURL(`tel:${facility.contact}`);
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!facility) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
                <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12 }}>Fasilitas tidak ditemukan</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "600" }}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const typeConfig = FACILITY_TYPES[facility.type];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Header Card */}
            <View
                style={{
                    backgroundColor: COLORS.surface,
                    margin: 16,
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: typeConfig.color + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                        }}
                    >
                        <Ionicons name={typeConfig.icon as any} size={30} color={typeConfig.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 22, fontWeight: "bold", color: COLORS.text }}>{facility.name}</Text>
                        <View
                            style={{
                                backgroundColor: typeConfig.color + "20",
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 12,
                                alignSelf: "flex-start",
                                marginTop: 6,
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: typeConfig.color }}>{typeConfig.label}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Info Cards */}
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
                {/* Address */}
                {facility.address && (
                    <View
                        style={{
                            backgroundColor: COLORS.surface,
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            flexDirection: "row",
                            alignItems: "flex-start",
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: COLORS.primary + "15",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>Alamat</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 20 }}>{facility.address}</Text>
                        </View>
                    </View>
                )}

                {/* Opening Hours */}
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: COLORS.warning + "15",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="time" size={20} color={COLORS.warning} />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>Jam Operasional</Text>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>Jadwal Mingguan</Text>
                        </View>
                    </View>

                    {(() => {
                        if (!facility.opening_hours) {
                            return <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Jam operasional tidak tersedia</Text>;
                        }

                        const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
                        const dayLabels: Record<string, string> = {
                            monday: "Senin",
                            tuesday: "Selasa",
                            wednesday: "Rabu",
                            thursday: "Kamis",
                            friday: "Jumat",
                            saturday: "Sabtu",
                            sunday: "Minggu",
                        };

                        const hoursRecord = typeof facility.opening_hours === "string" ? (JSON.parse(facility.opening_hours) as Record<string, OpeningHours>) : (facility.opening_hours as Record<string, OpeningHours>);

                        const today = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

                        return (
                            <View style={{ gap: 8 }}>
                                {dayKeys.map((day) => {
                                    const hours = hoursRecord[day];
                                    const isToday = day === today;
                                    if (!hours) return null;

                                    return (
                                        <View key={day} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: isToday ? COLORS.primary : COLORS.text,
                                                    fontWeight: isToday ? "700" : "400",
                                                }}
                                            >
                                                {dayLabels[day]}
                                                {isToday ? " (Hari Ini)" : ""}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: hours.closed ? COLORS.error : isToday ? COLORS.primary : COLORS.textSecondary,
                                                    fontWeight: isToday ? "600" : "400",
                                                }}
                                            >
                                                {hours.closed ? "Tutup" : `${hours.open} - ${hours.close}`}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })()}
                </View>

                {/* Contact */}
                {facility.contact && (
                    <TouchableOpacity
                        onPress={callContact}
                        style={{
                            backgroundColor: COLORS.surface,
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: COLORS.secondary + "15",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="call" size={20} color={COLORS.secondary} />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>Kontak</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text }}>{facility.contact}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Action Buttons */}
            <View style={{ padding: 16, gap: 12 }}>
                {facility.location && (
                    <TouchableOpacity
                        onPress={openMaps}
                        style={{
                            backgroundColor: COLORS.primary,
                            paddingVertical: 16,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="navigate" size={20} color="white" />
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginLeft: 8 }}>Buka di Google Maps</Text>
                    </TouchableOpacity>
                )}

                {facility.type === "waste_bank" && (
                    <TouchableOpacity
                        onPress={() => router.push("/(app)/deposit/qr")}
                        style={{
                            backgroundColor: COLORS.surface,
                            paddingVertical: 16,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: COLORS.primary,
                        }}
                    >
                        <Ionicons name="qr-code" size={20} color={COLORS.primary} />
                        <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "600", marginLeft: 8 }}>Deposit Sampah</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}
