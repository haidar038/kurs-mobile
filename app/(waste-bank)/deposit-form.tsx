import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS, WASTE_TYPES } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DepositFormScreen() {
    const { depositor_id, depositor_name } = useLocalSearchParams<{
        depositor_id: string;
        depositor_name: string;
    }>();
    const router = useRouter();
    const { user } = useAuth();

    const [wasteType, setWasteType] = useState("");
    const [weight, setWeight] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhotos([...photos, result.assets[0].uri].slice(0, 3));
        }
    };

    const handleSubmit = async () => {
        if (!wasteType) {
            Alert.alert("Error", "Pilih jenis sampah");
            return;
        }
        if (!weight || parseFloat(weight) <= 0) {
            Alert.alert("Error", "Masukkan berat sampah");
            return;
        }

        setIsLoading(true);

        try {
            // Upload photos
            const uploadedPhotos: string[] = [];
            for (const uri of photos) {
                const fileName = `deposits/${depositor_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
                const response = await fetch(uri);
                const blob = await response.blob();

                const { data, error } = await supabase.storage.from("deposit-photos").upload(fileName, blob, { contentType: "image/jpeg" });

                if (error) throw error;

                const { data: urlData } = supabase.storage.from("deposit-photos").getPublicUrl(data.path);

                uploadedPhotos.push(urlData.publicUrl);
            }

            // Create deposit record
            const { error } = await supabase.from("deposits").insert({
                depositor_id,
                verified_by: user?.id,
                waste_type: wasteType,
                weight: parseFloat(weight),
                photos: uploadedPhotos,
                notes: notes || null,
                status: "verified",
            });

            if (error) throw error;

            Alert.alert("Berhasil", "Deposit berhasil dicatat!", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Gagal menyimpan deposit");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 16 }}>
            {/* Depositor Info */}
            <View
                style={{
                    backgroundColor: COLORS.secondary + "20",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 20,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: COLORS.secondary,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>{depositor_name?.charAt(0).toUpperCase() || "?"}</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Depositor</Text>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}>{depositor_name || "Pengguna"}</Text>
                </View>
            </View>

            {/* Waste Type */}
            <View style={{ marginBottom: 20 }}>
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
                    {WASTE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            onPress={() => setWasteType(type.id)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 20,
                                backgroundColor: wasteType === type.id ? COLORS.secondary : COLORS.surface,
                                borderWidth: 1,
                                borderColor: wasteType === type.id ? COLORS.secondary : COLORS.border,
                            }}
                        >
                            <Text style={{ fontSize: 16, marginRight: 6 }}>{type.icon}</Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: wasteType === type.id ? "white" : COLORS.text,
                                    fontWeight: wasteType === type.id ? "600" : "400",
                                }}
                            >
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Weight */}
            <View style={{ marginBottom: 20 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.text,
                        marginBottom: 8,
                    }}
                >
                    Berat (kg)
                </Text>
                <TextInput
                    style={{
                        backgroundColor: COLORS.surface,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 18,
                    }}
                    placeholder="0.0"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                />
            </View>

            {/* Photos */}
            <View style={{ marginBottom: 20 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.text,
                        marginBottom: 8,
                    }}
                >
                    Foto Sampah
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    {photos.map((uri, index) => (
                        <View key={index} style={{ position: "relative" }}>
                            <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                            <TouchableOpacity
                                onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                                style={{
                                    position: "absolute",
                                    top: -6,
                                    right: -6,
                                    backgroundColor: COLORS.error,
                                    borderRadius: 10,
                                    padding: 2,
                                }}
                            >
                                <Ionicons name="close" size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {photos.length < 3 && (
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
                            <Ionicons name="camera" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
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
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 12,
                        padding: 16,
                        minHeight: 80,
                        textAlignVertical: "top",
                    }}
                    placeholder="Catatan tambahan..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                />
            </View>

            {/* Submit */}
            <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                    backgroundColor: COLORS.secondary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Simpan Deposit</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}
