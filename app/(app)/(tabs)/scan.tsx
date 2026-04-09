import { useAuth } from "@/providers/AuthProvider";
import { analyzeWasteImage, saveAnalysisResult, WasteAnalysisResult } from "@/services/ai";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<WasteAnalysisResult | null>(null);
    const [showResult, setShowResult] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { session } = useAuth();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: "center", marginBottom: 20 }}>Kami membutuhkan izin kamera untuk fitur ini.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Izinkan Kamera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    base64: true,
                    skipProcessing: true,
                });

                if (photo?.base64) {
                    setCapturedImage(photo.uri);
                    setIsScanning(true);

                    // Process with AI
                    try {
                        const result = await analyzeWasteImage(photo.base64);
                        setAnalysisResult(result);

                        // Save to DB if user is logged in
                        if (session?.user?.id) {
                            await saveAnalysisResult(session.user.id, photo.uri, result); // Note: ideally upload image to storage first
                        }

                        setShowResult(true);
                    } catch (error) {
                        Alert.alert("Gagal", (error as Error).message);
                        setCapturedImage(null);
                    } finally {
                        setIsScanning(false);
                    }
                }
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Gagal mengambil gambar.");
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setCapturedImage(result.assets[0].uri);
            setIsScanning(true);
            try {
                const aiResult = await analyzeWasteImage(result.assets[0].base64);
                setAnalysisResult(aiResult);
                setShowResult(true);
            } catch (error) {
                Alert.alert("Gagal", (error as Error).message);
                setCapturedImage(null);
            } finally {
                setIsScanning(false);
            }
        }
    };

    const resetScan = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setShowResult(false);
    };

    const pieData = analysisResult?.komposisi_chart.map((item, index) => ({
        value: item.persentase,
        color: index === 0 ? COLORS.lime : index === 1 ? "#6A0DAD" : "#E5E7EB",
        text: `${item.persentase}%`,
    }));

    return (
        <View style={styles.container}>
            {/* Camera View */}
            {!capturedImage ? (
                <CameraView style={styles.camera} ref={cameraRef} facing="back">
                    <View style={[styles.cameraOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={styles.aiBadge}>
                                <View style={styles.dot} />
                                <Text style={styles.aiText}>AI ENABLED</Text>
                            </View>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="flash-off" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Scanner Frame */}
                        <View style={styles.scannerFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                            {/* Scanning Animation Line could go here */}
                        </View>

                        {/* Controls */}
                        <View style={styles.controls}>
                            <TouchableOpacity onPress={pickImage} style={styles.secondaryButton}>
                                <Ionicons name="image" size={24} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                                <View style={styles.captureInner} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton}>
                                <Ionicons name="refresh" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            ) : (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                    {isScanning && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.lime} />
                            <Text style={styles.loadingText}>Menganalisa Sampah...</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Results Modal */}
            <Modal visible={showResult} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={resetScan} style={styles.closeModalButton}>
                                <Ionicons name="close" size={20} color="white" />
                                <Text style={styles.closeModalText}>Tutup</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
                            {/* Header Section */}
                            <View style={styles.resultHeader}>
                                <View>
                                    <View style={styles.badgeRow}>
                                        <Text style={styles.badgeLabel}>HASIL ANALISA</Text>
                                        <View style={styles.badgeDot} />
                                        <Text style={[styles.badgeLabel, { color: "#6A0DAD" }]}>{analysisResult?.estimasi_harga_per_kg && analysisResult.estimasi_harga_per_kg > 2000 ? "HIGH VALUE" : "LOW VALUE"}</Text>
                                    </View>
                                    <Text style={styles.wasteName}>{analysisResult?.nama_sampah}</Text>
                                    <Text style={styles.wasteType}>{analysisResult?.jenis_sampah}</Text>
                                </View>
                                <View style={styles.iconBox}>
                                    <Ionicons name="leaf" size={32} color={COLORS.success} />
                                </View>
                            </View>

                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <View style={styles.statCard}>
                                    <Ionicons name="hourglass" size={20} color="#9CA3AF" />
                                    <Text style={styles.statLabel}>TERURAI</Text>
                                    <Text style={[styles.statValue, { color: COLORS.error }]}>{analysisResult?.lama_terurai}</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="pricetag" size={20} color="#6A0DAD" />
                                    <Text style={styles.statLabel}>ESTIMASI</Text>
                                    <Text style={[styles.statValue, { color: "#6A0DAD" }]}>Rp {analysisResult?.estimasi_harga_per_kg}</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="leaf" size={20} color={COLORS.success} />
                                    <Text style={styles.statLabel}>IMPACT</Text>
                                    <Text style={[styles.statValue, { color: COLORS.success }]}>{analysisResult?.impact_co2 || "-20g CO2"}</Text>
                                </View>
                            </View>

                            {/* Chart Section */}
                            {pieData && (
                                <View style={styles.chartSection}>
                                    <View style={styles.chartWrapper}>
                                        <PieChart data={pieData} radius={35} innerRadius={20} centerLabelComponent={() => <Text style={{ fontSize: 8, fontWeight: "bold" }}>Scan</Text>} />
                                    </View>
                                    <View style={styles.chartLegend}>
                                        <Text style={styles.legendTitle}>Komposisi Sampah</Text>
                                        {analysisResult?.komposisi_chart.map((item, idx) => (
                                            <View key={idx} style={styles.legendItem}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                    <View style={[styles.legendDot, { backgroundColor: idx === 0 ? COLORS.lime : "#6A0DAD" }]} />
                                                    <Text style={styles.legendText}>{item.material}</Text>
                                                </View>
                                                <Text style={styles.legendValue}>{item.persentase}%</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Recommendations */}
                            <Text style={styles.sectionTitle}>REKOMENDASI PENANGANAN</Text>
                            <View style={styles.recommendationBox}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepText}>1</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.stepTitle}>Langkah Penanganan</Text>
                                    <Text style={styles.stepDesc}>{analysisResult?.rekomendasi_penanganan}</Text>
                                </View>
                            </View>

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        {/* Footer Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.deleteButton} onPress={resetScan}>
                                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={resetScan}>
                                <Ionicons name="add-circle-outline" size={24} color="white" />
                                <Text style={styles.saveText}>Simpan ke Inventaris</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
        justifyContent: "space-between",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
    },
    aiBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.lime,
    },
    aiText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    scannerFrame: {
        flex: 1,
        margin: 40,
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 40,
        height: 40,
        borderColor: COLORS.lime,
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

    controls: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    secondaryButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: "white",
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "white",
    },

    imagePreviewContainer: {
        flex: 1,
        backgroundColor: "black",
    },
    previewImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: COLORS.lime,
        marginTop: 20,
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 1,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: "85%",
        paddingTop: 20,
    },
    modalHeader: {
        alignItems: "center",
        marginBottom: 10,
    },
    closeModalButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "black",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    closeModalText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    resultScroll: {
        padding: 24,
    },
    resultHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    badgeLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#9CA3AF",
        letterSpacing: 1,
    },
    badgeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#D1D5DB",
    },
    wasteName: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1A1A2E",
        marginBottom: 4,
    },
    wasteType: {
        fontSize: 14,
        color: "#6B7280",
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
    },
    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    statLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "800",
    },
    chartSection: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        marginBottom: 32,
        gap: 20,
    },
    chartWrapper: {},
    chartLegend: {
        flex: 1,
        gap: 8,
    },
    legendTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 4,
    },
    legendItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: "#6B7280",
    },
    legendValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1F2937",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#9CA3AF",
        letterSpacing: 1,
        marginBottom: 12,
    },
    recommendationBox: {
        flexDirection: "row",
        gap: 16,
        marginTop: 8,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#1A1A2E",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#1A1A2E",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    stepText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1A1A2E",
        marginBottom: 4,
    },
    stepDesc: {
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 18,
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        flexDirection: "row",
        gap: 12,
    },
    deleteButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#FEF2F2",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEF2F2",
    },
    saveButton: {
        flex: 1,
        height: 48,
        backgroundColor: "#6A0DAD",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "#6A0DAD",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    saveText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    button: {
        backgroundColor: COLORS.lime,
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    buttonText: {
        color: "black",
        fontWeight: "bold",
    },
});
