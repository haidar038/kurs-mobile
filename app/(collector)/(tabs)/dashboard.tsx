import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { PickupRequest } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectorDashboard() {
    const { switchRole, profile, user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleSwitchToUser = () => {
        switchRole("user");
        router.replace("/(tabs)/home" as any);
    };

    // First, get the collector record for this user
    const { data: collector } = useQuery({
        queryKey: ["collector", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("collectors").select("*").eq("user_id", user!.id).single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

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
            const { data, error } = await supabase.from("pickup_requests").select("*").eq("collector_id", collector!.id).in("status", ["assigned", "en_route"]).order("created_at", { ascending: false });
            if (error) throw error;
            return data as PickupRequest[];
        },
        enabled: !!collector?.id,
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
        },
    });

    const onRefresh = async () => {
        await Promise.all([refetchAvailable(), refetchMyJobs()]);
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
                marginRight: isMyJob ? 16 : 0,
                width: isMyJob ? 300 : "100%",
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
                <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.primary }}>Rp {(item.fee ?? 0).toLocaleString("id-ID")}</Text>
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
                    onPress={() => acceptJobMutation.mutate(item.id)}
                    disabled={acceptJobMutation.isPending}
                    style={{
                        marginTop: 16,
                        backgroundColor: COLORS.primary,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: "center",
                        opacity: acceptJobMutation.isPending ? 0.7 : 1,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>Ambil Job</Text>
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
                        onPress={handleSwitchToUser}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: COLORS.surface,
                            padding: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                        }}
                    >
                        <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                        <Text style={{ marginLeft: 8, color: COLORS.primary, fontWeight: "600", fontFamily: "GoogleSans-Medium" }}>Mode User</Text>
                    </TouchableOpacity>
                </View>

                {/* Active Jobs Section (Horizontal if multiple, or just list) */}
                {myJobs && myJobs.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 12, fontFamily: "GoogleSans-Bold" }}>Job Aktif ({myJobs.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
                            {myJobs.map((job) => (
                                <View key={job.id}>{renderJobCard({ item: job, isMyJob: true })}</View>
                            ))}
                        </ScrollView>
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
