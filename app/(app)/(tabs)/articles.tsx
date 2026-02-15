import { supabase } from "@/lib/supabase";
import type { Article } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArticlesScreen() {
    const router = useRouter();
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

    const renderItem = ({ item }: { item: Article }) => (
        <TouchableOpacity
            onPress={() =>
                router.push({
                    pathname: "/(app)/article/[id]",
                    params: { id: item.id },
                })
            }
            style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                marginBottom: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: COLORS.border,
            }}
        >
            {item.cover_image && <Image source={{ uri: item.cover_image }} style={{ width: "100%", height: 160 }} resizeMode="cover" />}
            <View style={{ padding: 16 }}>
                {item.category && (
                    <Text
                        style={{
                            fontSize: 12,
                            color: COLORS.primary,
                            fontWeight: "600",
                            marginBottom: 8,
                        }}
                    >
                        {item.category.toUpperCase()}
                    </Text>
                )}
                <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text }} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        color: COLORS.textSecondary,
                        marginTop: 8,
                        lineHeight: 20,
                    }}
                    numberOfLines={2}
                >
                    {item.content
                        .replace(/<[^>]*>/g, "")
                        .replace(/[#*_>]/g, "")
                        .substring(0, 120)}
                    ...
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 12 }}>
                    {new Date(item.created_at ?? "").toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                {/* Header Container */}
                <View style={{ backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                    <View style={{ padding: 20, paddingBottom: 12 }}>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: COLORS.text }}>Artikel</Text>
                        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>Pelajari tentang pengelolaan sampah</Text>
                    </View>
                </View>

                <FlatList
                    data={articles}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60 }}>
                            <Ionicons name="book-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12 }}>Belum ada artikel</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
