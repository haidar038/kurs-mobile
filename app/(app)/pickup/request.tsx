import LocationPickerModal from "@/components/LocationPickerModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useAppStore } from "@/stores/useAppStore";
import { COLORS, MINIMUM_FEE, WASTE_TYPES } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PickupRequestScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { pickupDraft, updatePickupDraft, resetPickupDraft, currentLocation, setCurrentLocation } = useAppStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    useEffect(() => {
        getCurrentLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Error", "Izin lokasi diperlukan untuk layanan pickup");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            let formattedAddress = "";
            try {
                // Add a timeout race or just try-catch standard promise if expo doesn't support signal
                // Actually, just try-catch the reverseGeocodeAsync
                const [address] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (address) {
                    formattedAddress = [address.street, address.district, address.city, address.region].filter(Boolean).join(", ");
                }
            } catch (geocodeError) {
                console.log("Reverse geocode failed or timed out:", geocodeError);
                // Fallback: User must enter address manually
            }

            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                address: formattedAddress,
            });

            updatePickupDraft({ address: formattedAddress });
        } catch (error) {
            console.error("Location error:", error);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.7,
            selectionLimit: 5,
        });

        if (!result.canceled) {
            const newPhotos = result.assets.map((asset) => asset.uri);
            updatePickupDraft({
                photos: [...pickupDraft.photos, ...newPhotos].slice(0, 5),
            });
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Error", "Izin kamera diperlukan");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
        });

        if (!result.canceled) {
            updatePickupDraft({
                photos: [...pickupDraft.photos, result.assets[0].uri].slice(0, 5),
            });
        }
    };

    const removePhoto = (index: number) => {
        updatePickupDraft({
            photos: pickupDraft.photos.filter((_, i) => i !== index),
        });
    };

    const toggleWasteType = (typeId: string) => {
        const current = pickupDraft.wasteTypes;
        if (current.includes(typeId)) {
            updatePickupDraft({
                wasteTypes: current.filter((t) => t !== typeId),
            });
        } else {
            updatePickupDraft({
                wasteTypes: [...current, typeId],
            });
        }
    };

    const handleSubmit = async () => {
        if (pickupDraft.photos.length === 0) {
            Alert.alert("Error", "Tambahkan minimal 1 foto sampah");
            return;
        }

        if (pickupDraft.wasteTypes.length === 0) {
            Alert.alert("Error", "Pilih minimal 1 jenis sampah");
            return;
        }

        if (!pickupDraft.address) {
            Alert.alert("Error", "Alamat tidak boleh kosong");
            return;
        }

        setIsLoading(true);

        try {
            // Upload photos to Supabase Storage
            const uploadedPhotos: string[] = [];
            for (const photoUri of pickupDraft.photos) {
                const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

                console.log("Preparing to upload:", photoUri);
                // Use ArrayBuffer instead of Blob for better RN compatibility on Android
                const response = await fetch(photoUri);
                const arrayBuffer = await response.arrayBuffer();

                console.log(`File size: ${arrayBuffer.byteLength} bytes`);

                if (arrayBuffer.byteLength === 0) {
                    throw new Error("Gagal membaca file foto (0 bytes).");
                }

                const { data, error } = await supabase.storage.from("pickup-photos").upload(fileName, arrayBuffer, {
                    contentType: "image/jpeg",
                    upsert: false,
                });

                if (error) {
                    console.error("Supabase storage upload error:", error);
                    throw error;
                }

                const { data: urlData } = supabase.storage.from("pickup-photos").getPublicUrl(data.path);
                uploadedPhotos.push(urlData.publicUrl);
            }

            // Create pickup request
            const { data, error } = await supabase
                .from("pickup_requests")
                .insert({
                    user_id: user?.id,
                    location: {
                        type: "Point",
                        coordinates: [currentLocation?.longitude ?? 0, currentLocation?.latitude ?? 0],
                    },
                    address: pickupDraft.address,
                    waste_types: pickupDraft.wasteTypes,
                    photos: uploadedPhotos,
                    notes: pickupDraft.notes || null,
                    scheduled_at: pickupDraft.scheduledAt?.toISOString() || null,
                    fee: MINIMUM_FEE,
                })
                .select()
                .single();

            if (error) throw error;

            resetPickupDraft();
            Alert.alert("Berhasil", "Permintaan pickup telah dikirim!", [
                {
                    text: "OK",
                    onPress: () => router.replace(`/(app)/pickup/${data.id}` as any),
                },
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Gagal mengirim permintaan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 20 }}>
            {/* Location */}
            <View style={{ marginBottom: 24 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.text,
                        marginBottom: 8,
                    }}
                >
                    Alamat Pickup
                </Text>
                <View
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    {isLoadingLocation ? (
                        <ActivityIndicator style={{ marginLeft: 12 }} />
                    ) : (
                        <TextInput
                            style={{
                                flex: 1,
                                marginLeft: 12,
                                fontSize: 14,
                                color: COLORS.text,
                            }}
                            value={pickupDraft.address}
                            onChangeText={(text) => updatePickupDraft({ address: text })}
                            placeholder="Alamat pickup..."
                            multiline
                        />
                    )}
                </View>

                {/* Map picker button */}
                <TouchableOpacity
                    onPress={() => setShowMapPicker(true)}
                    style={{
                        marginTop: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: COLORS.primary + "15",
                    }}
                >
                    <Ionicons name="map" size={16} color={COLORS.primary} />
                    <Text style={{ marginLeft: 6, color: COLORS.primary, fontSize: 13, fontWeight: "600" }}>Pilih di Peta</Text>
                </TouchableOpacity>
            </View>

            {/* Photos */}
            <View style={{ marginBottom: 24 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.text,
                        marginBottom: 8,
                    }}
                >
                    Foto Sampah ({pickupDraft.photos.length}/5)
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    {pickupDraft.photos.map((uri, index) => (
                        <View key={index} style={{ position: "relative" }}>
                            <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                            <TouchableOpacity
                                onPress={() => removePhoto(index)}
                                style={{
                                    position: "absolute",
                                    top: -8,
                                    right: -8,
                                    backgroundColor: COLORS.error,
                                    borderRadius: 12,
                                    padding: 4,
                                }}
                            >
                                <Ionicons name="close" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {pickupDraft.photos.length < 5 && (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                                onPress={pickImage}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 8,
                                    borderWidth: 2,
                                    borderColor: COLORS.border,
                                    borderStyle: "dashed",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="images" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={takePhoto}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 8,
                                    borderWidth: 2,
                                    borderColor: COLORS.border,
                                    borderStyle: "dashed",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="camera" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Waste Types */}
            <View style={{ marginBottom: 24 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.text,
                        marginBottom: 8,
                    }}
                >
                    Jenis Sampah
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {WASTE_TYPES.map((type) => {
                        const isSelected = pickupDraft.wasteTypes.includes(type.id);
                        return (
                            <TouchableOpacity
                                key={type.id}
                                onPress={() => toggleWasteType(type.id)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    backgroundColor: isSelected ? COLORS.primary : COLORS.surface,
                                    borderWidth: 1,
                                    borderColor: isSelected ? COLORS.primary : COLORS.border,
                                }}
                            >
                                <Text style={{ fontSize: 16, marginRight: 6 }}>{type.icon}</Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: isSelected ? "white" : COLORS.text,
                                        fontWeight: isSelected ? "600" : "400",
                                    }}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Notes */}
            <View style={{ marginBottom: 24 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.text,
                        marginBottom: 8,
                    }}
                >
                    Catatan (opsional)
                </Text>
                <TextInput
                    style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        padding: 16,
                        fontSize: 14,
                        minHeight: 80,
                        textAlignVertical: "top",
                    }}
                    value={pickupDraft.notes}
                    onChangeText={(text) => updatePickupDraft({ notes: text })}
                    placeholder="Tambahkan catatan..."
                    multiline
                />
            </View>

            {/* Fee */}
            <View
                style={{
                    backgroundColor: COLORS.primary + "10",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 24,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Biaya Pickup</Text>
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: COLORS.primary,
                        marginTop: 4,
                    }}
                >
                    Rp {MINIMUM_FEE.toLocaleString("id-ID")}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>*Biaya minimum, dapat berubah sesuai volume</Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                    backgroundColor: COLORS.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Kirim Permintaan</Text>}
            </TouchableOpacity>

            {/* Location Picker Modal */}
            <LocationPickerModal
                visible={showMapPicker}
                initialLatitude={currentLocation?.latitude}
                initialLongitude={currentLocation?.longitude}
                onClose={() => setShowMapPicker(false)}
                onConfirm={(loc) => {
                    setCurrentLocation({
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        address: loc.address,
                    });
                    updatePickupDraft({ address: loc.address });
                    setShowMapPicker(false);
                }}
            />
        </ScrollView>
    );
}
