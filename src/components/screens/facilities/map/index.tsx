import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FacilitiesMapScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFacilities();
        getUserLocation();
    }, []);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Izin Ditolak", "Izin lokasi diperlukan untuk melihat jarak ke fasilitas.");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Animate to user location if available
            mapRef.current?.animateToRegion(
                {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                1000,
            );
        } catch (error) {
            console.error("Error getting location:", error);
        }
    };

    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase.from("facilities").select("*");
            if (error) throw error;

            // Filter facilities that have valid location data
            const validFacilities = (data || [])
                .filter((f: any) => f.location && typeof f.location === "object" && ("lat" in f.location || "latitude" in f.location))
                .map((f: any) => ({
                    ...f,
                    location: {
                        latitude: f.location.lat || f.location.latitude,
                        longitude: f.location.lng || f.location.longitude,
                    },
                }));

            setFacilities(validFacilities as any);
        } catch (error) {
            console.error("Error fetching facilities:", error);
            Alert.alert("Error", "Gagal memuat data fasilitas");
        } finally {
            setIsLoading(false);
        }
    };

    const getFacilityColor = (type: string) => {
        return type === "waste_bank" ? COLORS.success : COLORS.error; // Green for Bank Sampah, Red for TPS
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ flex: 1 }}>
                {/* Header Overlay */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cari Fasilitas</Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: -6.2, // Default to Jakarta
                            longitude: 106.816666,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {facilities.map((facility) => (
                            <Marker
                                key={facility.id}
                                coordinate={{
                                    latitude: (facility.location as any).latitude,
                                    longitude: (facility.location as any).longitude,
                                }}
                                title={facility.name}
                                description={facility.address || undefined}
                                pinColor={getFacilityColor(facility.type)}
                                onPress={() => {}} // Optional: Can center map or show custom callout
                            >
                                <Callout
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(app)/facilities/[id]",
                                            params: { id: facility.id },
                                        })
                                    }
                                >
                                    <View style={styles.calloutContainer}>
                                        <Text style={styles.calloutTitle}>{facility.name}</Text>
                                        <Text style={styles.calloutType}>{facility.type === "waste_bank" ? "Bank Sampah" : "TPS"}</Text>
                                        <Text style={styles.calloutDetail}>Ketuk untuk detail</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>
                )}

                {/* Legend Overlay */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                        <Text style={styles.legendText}>Bank Sampah</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
                        <Text style={styles.legendText}>TPS</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        position: "absolute",
        top: 10, // Adjusted as it's inside SafeAreaView
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    calloutContainer: {
        width: 150,
        padding: 4,
        alignItems: "center",
    },
    calloutTitle: {
        fontWeight: "bold",
        fontSize: 14,
        marginBottom: 2,
    },
    calloutType: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    calloutDetail: {
        fontSize: 10,
        color: COLORS.primary,
        marginTop: 4,
    },
    legendContainer: {
        position: "absolute",
        bottom: 30,
        left: 20,
        backgroundColor: "white",
        padding: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: "500",
    },
});
