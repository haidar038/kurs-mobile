import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { type MapPressEvent, Marker, type Region } from "./MapLib";

interface LocationResult {
    latitude: number;
    longitude: number;
    address: string;
}

interface LocationPickerModalProps {
    visible: boolean;
    initialLatitude?: number;
    initialLongitude?: number;
    onConfirm: (location: LocationResult) => void;
    onClose: () => void;
}

const DEFAULT_REGION: Region = {
    latitude: -6.2,
    longitude: 106.816666,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LocationPickerModal({ visible, initialLatitude, initialLongitude, onConfirm, onClose }: LocationPickerModalProps) {
    const mapRef = useRef<MapView>(null);
    const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
    const [address, setAddress] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialLatitude && initialLongitude) {
                setMarker({ latitude: initialLatitude, longitude: initialLongitude });
                reverseGeocode(initialLatitude, initialLongitude);
            } else {
                detectCurrentLocation();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const detectCurrentLocation = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const location = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setMarker(coords);
            reverseGeocode(coords.latitude, coords.longitude);

            mapRef.current?.animateToRegion(
                {
                    ...coords,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                },
                500,
            );
        } catch (err) {
            console.log("Location detect failed:", err);
        }
    }, []);

    const reverseGeocode = async (lat: number, lng: number) => {
        setIsGeocoding(true);
        try {
            const [result] = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });
            if (result) {
                const parts = [result.street, result.district, result.city, result.region].filter(Boolean);
                setAddress(parts.join(", "));
            } else {
                setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
        } catch {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleMapPress = (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarker({ latitude, longitude });
        reverseGeocode(latitude, longitude);
    };

    const handleConfirm = () => {
        if (!marker) return;
        onConfirm({
            latitude: marker.latitude,
            longitude: marker.longitude,
            address,
        });
    };

    const region: Region = marker ? { ...marker, latitudeDelta: 0.005, longitudeDelta: 0.005 } : DEFAULT_REGION;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                        <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pilih Lokasi</Text>
                    <TouchableOpacity onPress={detectCurrentLocation} style={styles.headerBtn}>
                        <Ionicons name="locate" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Map */}
                <MapView ref={mapRef} style={styles.map} initialRegion={region} onPress={handleMapPress} showsUserLocation showsMyLocationButton={false}>
                    {marker && (
                        <Marker
                            coordinate={marker}
                            draggable
                            onDragEnd={(e) => {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                setMarker({ latitude, longitude });
                                reverseGeocode(latitude, longitude);
                            }}
                        />
                    )}
                </MapView>

                {/* Bottom Panel */}
                <View style={styles.bottomPanel}>
                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={20} color={COLORS.primary} />
                        {isGeocoding ? (
                            <ActivityIndicator style={{ marginLeft: 12 }} />
                        ) : (
                            <Text style={styles.addressText} numberOfLines={2}>
                                {address || "Ketuk peta untuk memilih lokasi"}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity onPress={handleConfirm} disabled={!marker || isGeocoding} style={[styles.confirmBtn, (!marker || isGeocoding) && styles.confirmBtnDisabled]}>
                        <Text style={styles.confirmBtnText}>Konfirmasi Lokasi</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: "600", color: COLORS.text },
    map: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.6 },
    bottomPanel: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        marginTop: -20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    addressRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    addressText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    confirmBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { color: "white", fontSize: 16, fontWeight: "600" },
});
