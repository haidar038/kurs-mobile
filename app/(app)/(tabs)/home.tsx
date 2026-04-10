import HomeSkeleton from "@/components/ui/skeletons/HomeSkeleton";
import { useHomeData } from "@/hooks/useHomeData";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    const router = useRouter();
    const { stats, activePickup, articles, loading, locationName, hasUnreadNotifications, refreshLocation } = useHomeData();
    const [showNotifications, setShowNotifications] = useState(false);

    if (loading && !stats.totalWeight) {
        return <HomeSkeleton />;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Sticky Header */}

            <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                {/* Header (Non-sticky) */}
                <View
                    style={{
                        paddingTop: 12,
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        zIndex: 40,
                        marginBottom: 20,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="location" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium" }}>Lokasi Kamu</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text style={{ fontSize: 14, color: COLORS.text, fontFamily: "PublicSans-Bold" }}>{locationName}</Text>
                                <TouchableOpacity onPress={() => refreshLocation(true)} style={{ padding: 2 }}>
                                    <Ionicons name="refresh" size={14} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Notifications */}
                    <TouchableOpacity onPress={() => setShowNotifications(true)} style={{ position: "relative" }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
                        </View>
                        {hasUnreadNotifications && (
                            <View
                                style={{
                                    position: "absolute",
                                    top: 10,
                                    right: 10,
                                    width: 8,
                                    height: 8,
                                    backgroundColor: COLORS.error,
                                    borderRadius: 4,
                                    borderWidth: 1.5,
                                    borderColor: COLORS.surface,
                                }}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    {/* 1. HERO CARD */}
                    <View
                        style={{
                            backgroundColor: COLORS.primary,
                            borderRadius: 24,
                            padding: 16,
                            position: "relative",
                            overflow: "hidden",
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.2,
                            shadowRadius: 16,
                            elevation: 8,
                            marginBottom: 24,
                        }}
                    >
                        {/* Decorative Blobs */}
                        <View style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" }} />
                        <View style={{ position: "absolute", right: -16, top: -16, width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: "rgba(255,255,255,0.05)" }} />

                        <View>
                            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "PublicSans-Medium", marginBottom: 4 }}>Emisi Karbon Dihemat</Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 20, gap: 4 }}>
                                <Text style={{ fontSize: 36, color: "white", fontFamily: "PublicSans-Bold" }}>{stats.carbonSaved.toFixed(1)}</Text>
                                <Text style={{ fontSize: 18, color: "white", fontFamily: "PublicSans-Bold" }}>kg</Text>
                                <Text style={{ fontSize: 36, color: COLORS.lime, fontFamily: "PublicSans-Bold", marginLeft: 4 }}>CO{"\u00B2"}</Text>
                            </View>

                            <TouchableOpacity onPress={() => router.push("/(app)/wallet" as any)} style={{ flexDirection: "row", gap: 12 }}>
                                <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.lime, alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="wallet" size={20} color={COLORS.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "PublicSans-Medium" }}>Poin</Text>
                                        <Text style={{ fontSize: 18, color: "white", fontFamily: "PublicSans-Bold" }}>{stats.points.toLocaleString("id-ID")}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="leaf" size={20} color={COLORS.lime} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "PublicSans-Medium" }}>Disetor</Text>
                                        <Text style={{ fontSize: 18, color: "white", fontFamily: "PublicSans-Bold" }}>{stats.totalWeight}kg</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. ACTIVE ORDER WIDGET (Conditional) */}
                    {activePickup ? (
                        <TouchableOpacity
                            onPress={() => router.push(`/(app)/pickup/${activePickup.id}` as any)}
                            style={{
                                backgroundColor: COLORS.surface,
                                padding: 20,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                marginBottom: 24,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2,
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.lime }} />
                                    <Text style={{ fontSize: 10, fontFamily: "PublicSans-Bold", color: COLORS.primary, letterSpacing: 1, textTransform: "uppercase" }}>Pickup Aktif</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium", backgroundColor: COLORS.background, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 }}>
                                    #{activePickup.id.slice(0, 8)}
                                </Text>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <Image
                                    source={{ uri: activePickup.collector?.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Driver" }}
                                    style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.background }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>{activePickup.collector?.profile?.full_name || "Driver"}</Text>
                                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium" }}>
                                        {activePickup.collector?.vehicle_type || "Kendaraan"} • {activePickup.collector?.license_plate || "-"}
                                    </Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ fontSize: 14, fontFamily: "PublicSans-Bold", color: COLORS.primary }}>
                                        {activePickup.status === "assigned" ? "Menuju Lokasi" : activePickup.status === "en_route" ? "Sedang Mengangkut" : "Menunggu Driver"}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                                    <Text style={{ fontSize: 10, fontFamily: "PublicSans-Bold", color: COLORS.primary }}>Status</Text>
                                    <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-Bold" }}>Active</Text>
                                </View>
                                <View style={{ height: 6, backgroundColor: COLORS.background, borderRadius: 3, overflow: "hidden" }}>
                                    <View style={{ height: "100%", width: "100%", backgroundColor: COLORS.primary, borderRadius: 3 }} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : null}

                    {/* 3. MAIN MENU GRID */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Mau ngapain?</Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                            {/* Pickup Button */}
                            <TouchableOpacity
                                onPress={() => router.push("/(app)/pickup/request" as any)}
                                style={{
                                    flex: 1,
                                    height: 120,
                                    backgroundColor: "rgba(225, 255, 0, 0.1)",
                                    borderRadius: 16,
                                    padding: 16,
                                    justifyContent: "space-between",
                                    borderWidth: 2,
                                    borderColor: COLORS.lime,
                                }}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lime, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="car-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 10, color: COLORS.text, opacity: 0.7, fontFamily: "PublicSans-SemiBold" }}>Sampah Numpuk?</Text>
                                    <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Minta Pickup</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Search Location */}
                            <TouchableOpacity
                                onPress={() => router.push("/(app)/facilities/map" as any)}
                                style={{
                                    flex: 1,
                                    height: 120,
                                    backgroundColor: COLORS.surface,
                                    borderRadius: 16,
                                    padding: 16,
                                    justifyContent: "space-between",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="map-outline" size={20} color="#EA580C" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-SemiBold" }}>Cari Lokasi</Text>
                                    <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>TPS Terdekat</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", gap: 12 }}>
                            {/* Missions */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    height: 120,
                                    backgroundColor: COLORS.surface,
                                    borderRadius: 16,
                                    padding: 16,
                                    justifyContent: "space-between",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="trophy-outline" size={20} color="#2563EB" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 10, color: "#2563EB", fontFamily: "PublicSans-SemiBold" }}>5 Misi Baru</Text>
                                    <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Misi & Reward</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Chat */}
                            <TouchableOpacity
                                onPress={() => router.push("/(app)/chat" as any)}
                                style={{
                                    flex: 1,
                                    height: 120,
                                    backgroundColor: COLORS.surface,
                                    borderRadius: 16,
                                    padding: 16,
                                    justifyContent: "space-between",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                }}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="chatbubbles-outline" size={20} color={COLORS.error} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-SemiBold" }}>Ada Pertanyaan?</Text>
                                    <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Pesan</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        
                    </View>

                    {/* 4. CONTENT FEED */}
                    <View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Baca-baca Dulu</Text>
                            <TouchableOpacity>
                                <Text style={{ fontSize: 16, fontFamily: "PublicSans-Bold", color: COLORS.primary }}>Lihat Semua</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }} bounces={false} overScrollMode="never">
                            {articles.length > 0 ? (
                                articles.map((article) => (
                                    <TouchableOpacity
                                        key={article.id}
                                        onPress={() => router.push(`/(app)/article/${article.id}` as any)}
                                        style={{
                                            width: 240,
                                            backgroundColor: COLORS.surface,
                                            borderRadius: 16,
                                            padding: 12,
                                            borderWidth: 1,
                                            borderColor: COLORS.border,
                                        }}
                                    >
                                        <View style={{ width: "100%", height: 120, borderRadius: 8, backgroundColor: COLORS.background, marginBottom: 12, overflow: "hidden" }}>
                                            <Image source={{ uri: article.cover_image || "https://placehold.co/500x300" }} style={{ width: "100%", height: "100%" }} />
                                            <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                                <Text style={{ fontSize: 10, fontFamily: "PublicSans-Bold", color: COLORS.primary, textTransform: "capitalize" }}>{article.category || "Tips"}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 14, fontFamily: "PublicSans-Bold", color: COLORS.text, marginBottom: 4 }} numberOfLines={2}>
                                            {article.title}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium" }}>
                                            {article.created_at
                                                ? new Date(article.created_at).toLocaleDateString("id-ID", {
                                                      day: "numeric",
                                                      month: "long",
                                                      year: "numeric",
                                                  })
                                                : "Baru saja"}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ color: COLORS.textSecondary, padding: 20 }}>Belum ada artikel.</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>

            {/* Notification Modal */}
            {showNotifications && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, justifyContent: "center", alignItems: "center" }}>
                    <View style={{ width: "85%", backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, elevation: 5 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Notifikasi</Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ alignItems: "center", paddingVertical: 20 }}>
                            <Ionicons name="notifications-off-outline" size={48} color={COLORS.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
                            <Text style={{ fontFamily: "PublicSans-Medium", color: COLORS.textSecondary }}>Belum ada notifikasi baru</Text>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
