import { supabase } from "@/lib/supabase";
import type { Article } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArticlesScreen() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("Semua");

    const {
        data: articles,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["articles"],
        queryFn: async () => {
            const { data, error } = await supabase.from("articles").select("*").eq("published", true).order("created_at", { ascending: false });
            if (error) throw error;
            return data as Article[];
        },
    });

    const categories = useMemo(() => {
        const cats = new Set(["Semua"]);
        articles?.forEach((a) => {
            if (a.category) cats.add(a.category);
        });
        return Array.from(cats);
    }, [articles]);

    const filteredArticles = useMemo(() => {
        if (!articles) return [];
        if (activeCategory === "Semua") return articles;
        return articles.filter((a) => a.category === activeCategory);
    }, [articles, activeCategory]);

    const heroArticle = activeCategory === "Semua" ? filteredArticles[0] : null;
    const remainingArticles = activeCategory === "Semua" ? filteredArticles.slice(1) : filteredArticles;

    const calculateReadTime = (content: string) => {
        const words = content.split(" ").length;
        const time = Math.ceil(words / 200);
        return `${time} min baca`;
    };

    const renderHeroArticle = () => {
        if (!heroArticle) return null;
        return (
            <TouchableOpacity onPress={() => router.push({ pathname: "/(app)/article/[id]", params: { id: heroArticle.id } })} style={{ marginBottom: 24 }}>
                <View style={{ height: 260, borderRadius: 32, overflow: "hidden", position: "relative" }}>
                    <Image source={{ uri: heroArticle.cover_image || "https://placehold.co/800x600" }} style={{ width: "100%", height: "100%" }} />
                    <LinearGradient colors={["transparent", "rgba(26, 26, 46, 0.95)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100%" }} />
                    <View style={{ position: "absolute", bottom: 0, left: 0, padding: 20, width: "100%" }}>
                        <View style={{ alignSelf: "flex-start", backgroundColor: COLORS.lime, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 }}>
                            <Text style={{ fontSize: 10, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Lagi Rame 🔥</Text>
                        </View>
                        <Text style={{ fontSize: 22, fontFamily: "PublicSans-Bold", color: "white", marginBottom: 8 }} numberOfLines={2}>
                            {heroArticle.title}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "PublicSans-Medium" }}>{calculateReadTime(heroArticle.content)}</Text>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "PublicSans-Medium" }}>
                                {new Date(heroArticle.created_at ?? "").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Article }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: "/(app)/article/[id]", params: { id: item.id } })}
            style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                marginBottom: 16,
                padding: 12,
                flexDirection: "row",
                gap: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
            }}
        >
            <View style={{ width: 100, height: 100, borderRadius: 16, overflow: "hidden", backgroundColor: COLORS.background }}>
                <Image source={{ uri: item.cover_image || "https://placehold.co/400x400" }} style={{ width: "100%", height: "100%" }} />
            </View>

            <View style={{ flex: 1, justifyContent: "space-between", paddingVertical: 2 }}>
                <View>
                    <Text style={{ fontSize: 10, fontFamily: "PublicSans-Bold", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{item.category || "Tips"}</Text>
                    <Text style={{ fontSize: 14, fontFamily: "PublicSans-Bold", color: COLORS.text, lineHeight: 20 }} numberOfLines={2}>
                        {item.title}
                    </Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium" }}>{calculateReadTime(item.content)}</Text>
                    <TouchableOpacity>
                        <Ionicons name="bookmark-outline" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
            <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                {/* Header Container */}
                <View style={{ backgroundColor: COLORS.surface, paddingBottom: 4 }}>
                    <View style={{ paddingHorizontal: 20, paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <View>
                            <Text style={{ fontSize: 24, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Jelajah Ilmu 💡</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "PublicSans-Medium", marginTop: 2 }}>Update wawasan lingkunganmu</Text>
                        </View>
                        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Category Pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setActiveCategory(cat)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 100,
                                    backgroundColor: activeCategory === cat ? COLORS.primary : COLORS.surface,
                                    borderWidth: 1,
                                    borderColor: activeCategory === cat ? COLORS.primary : COLORS.border,
                                    shadowColor: activeCategory === cat ? COLORS.primary : "transparent",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: activeCategory === cat ? 4 : 0,
                                }}
                            >
                                <Text style={{ fontSize: 12, textTransform: "capitalize", fontFamily: "PublicSans-Bold", color: activeCategory === cat ? "white" : COLORS.textSecondary }}>{cat === "Semua" ? "For You" : cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={remainingArticles}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeroArticle}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                                <Ionicons name="book-outline" size={40} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: 18, fontFamily: "PublicSans-Bold", color: COLORS.text }}>Belum ada artikel</Text>
                            <Text style={{ fontSize: 14, fontFamily: "PublicSans-Medium", color: COLORS.textSecondary, marginTop: 4, textAlign: "center", paddingHorizontal: 40 }}>
                                Terus pantau ya, ilmu seru tentang lingkungan akan segera hadir!
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
