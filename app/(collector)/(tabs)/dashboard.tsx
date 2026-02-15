import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { PickupRequest } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectorDashboard() {
    const { profile, user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isTracking, setIsTracking] = useState(false);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

    // Get collector record
    const { data: collector, refetch: refetchCollector } = useQuery({
        queryKey: ["collector", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("collectors").select("*").eq("user_id", user!.id).single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    // Sync local tracking state with DB status whenever it changes
    useEffect(() => {
        if (collector) {
            setIsTracking(collector.status === "available");
        }
    }, [collector, collector?.status]);

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [locationSubscription]);

    // Handle tracking logic
    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                alert("Izin lokasi diperlukan untuk fitur ini.");
                setIsTracking(false);
                return;
            }

            sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 10000,
                    distanceInterval: 10,
                },
                async (location) => {
                    if (collector?.id) {
                        const { latitude, longitude } = location.coords;
                        await supabase
                            .from("collectors")
                            .update({
                                current_location: { lat: latitude, lng: longitude },
                            })
                            .eq("id", collector.id);
                    }
                },
            );
            setLocationSubscription(sub);
        };

        const stopTracking = () => {
            if (locationSubscription) {
                locationSubscription.remove();
                setLocationSubscription(null);
            }
            if (sub) {
                sub.remove();
            }
        };

        if (isTracking) {
            startTracking();
        } else {
            stopTracking();
        }

        return () => {
            if (sub) sub.remove();
            if (locationSubscription) locationSubscription.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTracking, collector?.id]);

    const toggleStatus = async () => {
        const newStatus = !isTracking;
        setIsTracking(newStatus);

        if (collector?.id) {
            const statusToSet = newStatus ? "available" : "offline";
            await supabase.from("collectors").update({ status: statusToSet }).eq("id", collector.id);
            queryClient.invalidateQueries({ queryKey: ["collector", user?.id] });
        }
    };

    // Get available jobs (requested status)
    const {
        data: availableJobs,
        isLoading: isLoadingAvailable,
        refetch: refetchAvailable,
    } = useQuery({
        queryKey: ["available-jobs"],
        queryFn: async () => {
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("status", "requested").order("created_at", { ascending: false });
            if (error) throw error;
            return data as PickupRequest[];
        },
    });

    // Get my active jobs
    const { data: myJobs, refetch: refetchMyJobs } = useQuery({
        queryKey: ["my-jobs", collector?.id],
        queryFn: async () => {
            const { data } = await supabase.from("collectors").select("*").eq("user_id", user!.id).single();
            if (data) {
                const { data: jobs, error: jobsError } = await supabase.from("pickup_requests").select("*").eq("collector_id", data.id).in("status", ["assigned", "en_route"]).order("created_at", { ascending: false });
                if (jobsError) throw jobsError;
                return jobs as PickupRequest[];
            }
            return [];
        },
        enabled: !!user?.id,
    });

    const acceptJobMutation = useMutation({
        mutationFn: async (jobId: string) => {
            const { error } = await supabase
                .from("pickup_requests")
                .update({
                    collector_id: collector?.id,
                    status: "assigned",
                })
                .eq("id", jobId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
            alert("Job berhasil diambil!");
        },
        onError: (error) => {
            alert("Gagal mengambil job: " + error.message);
        },
    });

    const onRefresh = async () => {
        await Promise.all([refetchAvailable(), refetchMyJobs(), refetchCollector()]);
    };

    const renderJobCard = ({ item, isMyJob }: { item: PickupRequest; isMyJob?: boolean }) => (
        <View
            style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                width: "100%",
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>{new Date(item.created_at ?? "").toLocaleString("id-ID")}</Text>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: COLORS.text,
                            marginTop: 4,
                        }}
                        numberOfLines={2}
                    >
                        {item.address || "Alamat tidak tersedia"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginLeft: 4 }}>{item.volume_estimate || "Estimasi tidak ada"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 4 }}>
                        {item.waste_types.map((type: string) => (
                            <View
                                key={type}
                                style={{
                                    backgroundColor: COLORS.primary + "20",
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ fontSize: 12, color: COLORS.primary }}>{type}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.primary }}>Rp {(item.fee ?? 0).toLocaleString("id-ID")}</Text>
                </View>
            </View>

            {isMyJob ? (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                    <TouchableOpacity
                        onPress={() => router.push(`/(collector)/job/${item.id}`)}
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.primary,
                            paddingVertical: 12,
                            borderRadius: 8,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "white", fontWeight: "600" }}>Detail</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${item.address}`;
                            Linking.openURL(url);
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.secondary,
                            paddingVertical: 12,
                            borderRadius: 8,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="navigate" size={16} color="white" />
                        <Text style={{ color: "white", fontWeight: "600", marginLeft: 4 }}>Navigasi</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    onPress={() => {
                        if (myJobs && myJobs.length > 0) {
                            alert("Selesaikan job aktif Anda terlebih dahulu sebelum mengambil job baru.");
                            return;
                        }
                        acceptJobMutation.mutate(item.id);
                    }}
                    disabled={acceptJobMutation.isPending || (myJobs && myJobs.length > 0)}
                    style={{
                        marginTop: 16,
                        backgroundColor: myJobs && myJobs.length > 0 ? COLORS.textSecondary + "40" : COLORS.primary,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: "center",
                        opacity: acceptJobMutation.isPending ? 0.7 : 1,
                    }}
                >
                    {acceptJobMutation.isPending ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "600" }}>{myJobs && myJobs.length > 0 ? "Selesaikan Job Aktif" : "Ambil Job"}</Text>}
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isLoadingAvailable} onRefresh={onRefresh} />}>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, fontFamily: "GoogleSans-Bold" }}>Halo, Mitra!</Text>
                        <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: "GoogleSans-Regular" }}>{profile?.full_name}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={toggleStatus}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: isTracking ? "#E6F4EA" : "#FCE8E6",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: isTracking ? "#1E8E3E" : "#C5221F",
                        }}
                    >
                        <View
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: isTracking ? "#1E8E3E" : "#C5221F",
                                marginRight: 8,
                            }}
                        />
                        <Text
                            style={{
                                color: isTracking ? "#1E8E3E" : "#C5221F",
                                fontWeight: "600",
                                fontFamily: "GoogleSans-Medium",
                            }}
                        >
                            {isTracking ? "Online" : "Offline"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Status Card (if needed, but header toggle is cleaner) */}
                {collector && (
                    <View style={{ backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>Status Kendaraan</Text>
                        <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                            {collector.vehicle_type} - {collector.license_plate}
                        </Text>
                    </View>
                )}

                {/* Active Jobs Section (Vertical list for consistency) */}
                {myJobs && myJobs.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 12, fontFamily: "GoogleSans-Bold" }}>Job Aktif ({myJobs.length})</Text>
                        <View>
                            {myJobs.map((job) => (
                                <View key={job.id}>{renderJobCard({ item: job, isMyJob: true })}</View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Available Jobs Section */}
                <View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 12, fontFamily: "GoogleSans-Bold" }}>Job Tersedia</Text>
                    {availableJobs?.length === 0 ? (
                        <View style={{ alignItems: "center", padding: 32, backgroundColor: COLORS.surface, borderRadius: 12 }}>
                            <Ionicons name="car-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 12, textAlign: "center" }}>Belum ada job tersedia saat ini.</Text>
                        </View>
                    ) : (
                        availableJobs?.map((job) => <View key={job.id}>{renderJobCard({ item: job })}</View>)
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
