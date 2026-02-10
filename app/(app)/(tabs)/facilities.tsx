import { supabase } from "@/lib/supabase";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";

interface Facility {
    id: string;
    name: string;
    type: "tps" | "waste_bank";
    address: string | null;
    location: { latitude: number; longitude: number } | null;
    contact: string | null;
    opening_hours: { open: string; close: string } | null;
}

const FACILITY_TYPES = {
    tps: { label: "TPS", icon: "trash-bin", color: "#EF4444" },
    waste_bank: { label: "Bank Sampah", icon: "leaf", color: "#10B981" },
} as const;

export default function FacilitiesScreen() {
    const router = useRouter();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedType, setSelectedType] = useState<"all" | "tps" | "waste_bank">("all");
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        getUserLocation();
        fetchFacilities();
    }, []);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                // Permission denied, just ignore and don't show distance
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            // Location services might be disabled, or timeout
            console.log("Location error (gracefully handled):", error);
        }
    };

    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase.from("facilities").select("*").order("name");

            if (error) throw error;
            setFacilities((data || []) as Facility[]);
        } catch (error) {
            console.error("Fetch facilities error:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchFacilities();
    };

    const filteredFacilities = facilities.filter((f) => (selectedType === "all" ? true : f.type === selectedType));

    const getDistance = (facility: Facility): string | null => {
        if (!userLocation || !facility.location) return null;

        const R = 6371; // km
        const dLat = ((facility.location.latitude - userLocation.latitude) * Math.PI) / 180;
        const dLon = ((facility.location.longitude - userLocation.longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((userLocation.latitude * Math.PI) / 180) * Math.cos((facility.location.latitude * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        }
        return `${distance.toFixed(1)} km`;
    };

    const openInMaps = (facility: Facility) => {
        if (!facility.location) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.location.latitude},${facility.location.longitude}`;
        Linking.openURL(url);
    };

    const renderFacilityCard = ({ item }: { item: Facility }) => {
        const typeConfig = FACILITY_TYPES[item.type];
        const distance = getDistance(item);

        return (
            <TouchableOpacity
                onPress={() => router.push(`/(app)/facilities/${item.id}` as any)}
                style={{
                    backgroundColor: COLORS.surface,
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: typeConfig.color + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Ionicons name={typeConfig.icon as any} size={22} color={typeConfig.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>{item.name}</Text>
                        <View
                            style={{
                                backgroundColor: typeConfig.color + "20",
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 8,
                                alignSelf: "flex-start",
                                marginTop: 2,
                            }}
                        >
                            <Text style={{ fontSize: 11, fontWeight: "600", color: typeConfig.color }}>{typeConfig.label}</Text>
                        </View>
                    </View>
                    {distance && (
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.primary }}>{distance}</Text>
                        </View>
                    )}
                </View>

                {item.address && (
                    <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 8 }}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginLeft: 6, flex: 1 }}>{item.address}</Text>
                    </View>
                )}

                {item.opening_hours && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginLeft: 6 }}>
                            {item.opening_hours.open} - {item.opening_hours.close}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
                    {item.location && (
                        <TouchableOpacity
                            onPress={() => openInMaps(item)}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: COLORS.primary + "10",
                                paddingVertical: 10,
                                borderRadius: 8,
                            }}
                        >
                            <Ionicons name="navigate" size={16} color={COLORS.primary} />
                            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Navigasi</Text>
                        </TouchableOpacity>
                    )}
                    {item.contact && (
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${item.contact}`)}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: COLORS.secondary + "10",
                                paddingVertical: 10,
                                borderRadius: 8,
                            }}
                        >
                            <Ionicons name="call" size={16} color={COLORS.secondary} />
                            <Text style={{ color: COLORS.secondary, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Hubungi</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Header */}
            <View style={{ padding: 20, paddingBottom: 12, backgroundColor: COLORS.surface }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text }}>Fasilitas</Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>TPS & Bank Sampah terdekat</Text>
            </View>

            {/* Filter Tabs */}
            <View
                style={{
                    flexDirection: "row",
                    padding: 16,
                    paddingTop: 12,
                    paddingBottom: 8,
                    gap: 8,
                    backgroundColor: COLORS.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                }}
            >
                {(["all", "tps", "waste_bank"] as const).map((type) => (
                    <TouchableOpacity
                        key={type}
                        onPress={() => setSelectedType(type)}
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: selectedType === type ? COLORS.primary : COLORS.background,
                            borderWidth: 1,
                            borderColor: selectedType === type ? COLORS.primary : COLORS.border,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: selectedType === type ? "600" : "400",
                                color: selectedType === type ? "white" : COLORS.text,
                            }}
                        >
                            {type === "all" ? "Semua" : FACILITY_TYPES[type].label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredFacilities}
                    renderItem={renderFacilityCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60 }}>
                            <Ionicons name="location-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12 }}>Tidak ada fasilitas ditemukan</Text>
                            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>Coba ubah filter atau tarik untuk refresh</Text>
                        </View>
                    }
                    ListHeaderComponent={<Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>{filteredFacilities.length} fasilitas ditemukan</Text>}
                />
            )}
        </View>
    );
}
