import { supabase } from "@/lib/supabase";
import { Article } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, ScrollView, Share, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper to sanitize HTML
function cleanHTML(html: string) {
    return html.replace(/<p><\/p>/g, "").replace(/\n/g, "");
}

// Custom styles for HTML tags
const tagsStyles: any = {
    p: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 12,
        color: COLORS.text,
    },
    strong: {
        fontWeight: "700",
        color: COLORS.text,
    },
    b: {
        fontWeight: "700",
        color: COLORS.text,
    },
    ul: {
        marginBottom: 12,
        paddingLeft: 20,
    },
    ol: {
        marginBottom: 12,
        paddingLeft: 20,
    },
    li: {
        marginBottom: 4,
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.text,
    },
    a: {
        color: COLORS.primary,
        textDecorationLine: "underline",
        fontWeight: "600",
    },
    h1: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 12,
        marginTop: 16,
        lineHeight: 32,
    },
    h2: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 10,
        marginTop: 14,
        lineHeight: 28,
    },
    h3: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 12,
        lineHeight: 24,
    },
    blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        paddingLeft: 12,
        marginLeft: 0,
        marginBottom: 16,
        backgroundColor: COLORS.surface,
        paddingVertical: 8,
    },
};

export default function ArticleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { width } = useWindowDimensions();
    const source = {
        html: cleanHTML(article?.content || ""),
    };

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();

                if (error) throw error;
                setArticle(data as Article);
            } catch (error) {
                console.error("Fetch article error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchArticle();
    }, [id]);

    const handleShare = async () => {
        if (!article) return;
        try {
            await Share.share({
                message: `${article.title}\n\nBaca selengkapnya di aplikasi KURS.`,
            });
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!article) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
                <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12 }}>Artikel tidak ditemukan</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "600" }}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["top"]}>
            <View style={{ flex: 1 }}>
                {/* Custom Header to overlay scrollview or stick to top */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: COLORS.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                    }}
                >
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                        <TouchableOpacity onPress={handleShare}>
                            <Ionicons name="share-outline" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    {article.cover_image && <Image source={{ uri: article.cover_image }} style={{ width: "100%", height: 240 }} resizeMode="cover" />}

                    <View style={{ padding: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                            {article.category && (
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: COLORS.primary,
                                        fontWeight: "700",
                                        letterSpacing: 0.5,
                                        marginRight: 12,
                                    }}
                                >
                                    {article.category.toUpperCase()}
                                </Text>
                            )}
                            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                                {new Date(article.created_at ?? "").toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </Text>
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 16, lineHeight: 32 }}>{article.title}</Text>

                        <RenderHTML
                            contentWidth={width}
                            source={source}
                            tagsStyles={tagsStyles}
                            renderersProps={{
                                a: {
                                    onPress: (_, href) => {
                                        Linking.openURL(href);
                                    },
                                },
                            }}
                        />

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
                                {article.tags.map((tag, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            backgroundColor: COLORS.background,
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: COLORS.border,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
