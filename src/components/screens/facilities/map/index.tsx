import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Disable access token for OSM
MapLibreGL.setAccessToken(null);

export default function FacilitiesMapScreen() {
    const router = useRouter();
    const cameraRef = useRef<MapLibreGL.CameraRef>(null);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchFacilities();
    }, []);

    useEffect(() => {
        if (selectedFacility) {
            // Start pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.5,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [selectedFacility, pulseAnim]);

    const handleSelectFacility = (facility: Facility) => {
        setSelectedFacility(facility);
        // Center camera on selected facility with nice zoom
        cameraRef.current?.setCamera({
            centerCoordinate: [(facility.location as any).longitude, (facility.location as any).latitude],
            zoomLevel: 15,
            animationDuration: 800,
        });
    };

    const handleLocateMe = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Izin Ditolak", "Izin lokasi diperlukan.");
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            cameraRef.current?.setCamera({
                centerCoordinate: [location.coords.longitude, location.coords.latitude],
                zoomLevel: 15,
                animationDuration: 1000,
            });
        } catch (error) {
            console.error("Error getting location:", error);
        }
    };

    const fetchFacilities = async () => {
        try {
            const { data, error } = await supabase.from("facilities").select("*");
            if (error) throw error;

            const validFacilities = (data || [])
                .filter((f: any) => {
                    if (!f.location || typeof f.location !== "object") return false;
                    const loc = f.location as any;
                    return "lat" in loc || "latitude" in loc || "coordinates" in loc || ("longitude" in loc && "latitude" in loc);
                })
                .map((f: any) => {
                    const loc = f.location as any;
                    let latitude = 0;
                    let longitude = 0;

                    if (loc.coordinates && Array.isArray(loc.coordinates)) {
                        longitude = parseFloat(loc.coordinates[0]);
                        latitude = parseFloat(loc.coordinates[1]);
                    } else {
                        latitude = parseFloat(loc.lat || loc.latitude || 0);
                        longitude = parseFloat(loc.lng || loc.longitude || 0);
                    }

                    return {
                        ...f,
                        location: {
                            latitude,
                            longitude,
                        },
                    };
                })
                .filter((f) => !isNaN(f.location.latitude) && !isNaN(f.location.longitude));

            setFacilities(validFacilities as any);
        } catch (error) {
            console.error("Error fetching facilities:", error);
            Alert.alert("Error", "Gagal memuat data fasilitas");
        } finally {
            setIsLoading(false);
        }
    };

    const getFacilityColor = (type: string) => {
        return type === "waste_bank" ? COLORS.success : COLORS.error;
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ flex: 1 }}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <MapLibreGL.MapView style={{ flex: 1 }} logoEnabled={false} attributionEnabled={true} onPress={() => setSelectedFacility(null)}>
                        <MapLibreGL.Camera
                            ref={cameraRef}
                            defaultSettings={{
                                centerCoordinate: [127.3407976, 0.8112671],
                                zoomLevel: 11,
                            }}
                        />

                        {/* Positron Tiles */}
                        <MapLibreGL.RasterSource id="positron" tileUrlTemplates={["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"]} tileSize={256}>
                            <MapLibreGL.RasterLayer id="positronLayer" sourceID="positron" />
                        </MapLibreGL.RasterSource>

                        {/* Built-in User Location */}
                        <MapLibreGL.UserLocation visible={true} renderMode="normal" minDisplacement={999999} />

                        {/* Facility Markers */}
                        {facilities.map((facility) => (
                            <MapLibreGL.MarkerView key={facility.id} id={facility.id} coordinate={[(facility.location as any).longitude, (facility.location as any).latitude]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap={true}>
                                <View collapsable={false} style={styles.markerWrapper}>
                                    {selectedFacility?.id === facility.id && (
                                        <Animated.View
                                            style={[
                                                styles.pulseCircle,
                                                {
                                                    backgroundColor: getFacilityColor(facility.type),
                                                    transform: [{ scale: pulseAnim }],
                                                },
                                            ]}
                                        />
                                    )}
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => handleSelectFacility(facility)}
                                        style={[
                                            styles.markerContainer,
                                            { backgroundColor: getFacilityColor(facility.type) },
                                            selectedFacility?.id === facility.id && {
                                                ...styles.selectedMarker,
                                                borderColor: getFacilityColor(facility.type),
                                            },
                                        ]}
                                    >
                                        <Ionicons name={facility.type === "waste_bank" ? "leaf" : "trash"} size={14} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </MapLibreGL.MarkerView>
                        ))}
                    </MapLibreGL.MapView>
                )}

                {/* Legend Overlay */}
                {!selectedFacility && (
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
                )}

                {/* Floating Locate Button */}
                <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}>
                    <Ionicons name="locate" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Preview Panel */}
                {selectedFacility && (
                    <View style={styles.previewPanel}>
                        <View style={styles.previewContent}>
                            <View style={styles.previewHeader}>
                                <View style={[styles.typeBadge, { backgroundColor: getFacilityColor(selectedFacility.type) + "20" }]}>
                                    <Text style={[styles.typeText, { color: getFacilityColor(selectedFacility.type) }]}>{selectedFacility.type === "waste_bank" ? "Bank Sampah" : "TPS"}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedFacility(null)}>
                                    <Ionicons name="close-circle" size={24} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.facilityName} numberOfLines={1}>
                                {selectedFacility.name}
                            </Text>
                            <Text style={styles.facilityAddress} numberOfLines={2}>
                                {selectedFacility.address || "Alamat tidak tersedia"}
                            </Text>

                            <TouchableOpacity
                                style={[styles.detailButton, { backgroundColor: getFacilityColor(selectedFacility.type) }]}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(app)/facilities/[id]",
                                        params: { id: selectedFacility.id },
                                    })
                                }
                            >
                                <Text style={styles.detailButtonText}>Lihat Detail</Text>
                                <Ionicons name="chevron-forward" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    markerWrapper: {
        width: 60,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    },
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    selectedMarker: {
        transform: [{ scale: 1.2 }],
        borderWidth: 4,
    },
    pulseCircle: {
        position: "absolute",
        width: 32,
        height: 32,
        borderRadius: 16,
        opacity: 0.3,
    },
    locateButton: {
        position: "absolute",
        right: 20,
        bottom: 120,
        backgroundColor: "white",
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    legendContainer: {
        position: "absolute",
        bottom: 30,
        left: 20,
        backgroundColor: "rgba(255,255,255,0.95)",
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    legendText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: "600",
    },
    previewPanel: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "white",
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        overflow: "hidden",
    },
    previewContent: {
        padding: 20,
    },
    previewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    facilityName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 4,
    },
    facilityAddress: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    detailButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 14,
    },
    detailButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        marginRight: 6,
    },
});
