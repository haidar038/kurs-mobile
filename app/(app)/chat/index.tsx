import { ChatRoomWithParticipants, useChatRooms } from "@/hooks/useChat";
import { useHomeData } from "@/hooks/useHomeData";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatListScreen() {
    const router = useRouter();
    const { rooms, loading, refresh } = useChatRooms();
    const { activePickup } = useHomeData();
    const [searchQuery, setSearchQuery] = useState("");

    const activeCollectorId = activePickup?.collector?.profile?.id;

    // Filter by search query
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return rooms;
        const lowerQuery = searchQuery.toLowerCase();
        return rooms.filter((room) => {
            const otherParticipant = room.participants[0]?.user;
            const name = otherParticipant?.full_name || "Unknown User";
            return name.toLowerCase().includes(lowerQuery);
        });
    }, [rooms, searchQuery]);

    // Grouping
    const activeRooms = useMemo(() => {
        if (!activeCollectorId) return [];
        return filteredRooms.filter((r) => r.participants.some((p) => p.user.id === activeCollectorId));
    }, [filteredRooms, activeCollectorId]);

    const historyRooms = useMemo(() => {
        if (!activeCollectorId) return filteredRooms;
        return filteredRooms.filter((r) => !r.participants.some((p) => p.user.id === activeCollectorId));
    }, [filteredRooms, activeCollectorId]);

    const renderRoomItem = (item: ChatRoomWithParticipants, isActive: boolean) => {
        const otherParticipant = item.participants[0]?.user;
        const lastMessage = item.last_message;

        const displayName = otherParticipant?.full_name || "Unknown User";
        const avatarUrl = otherParticipant?.avatar_url;

        const isUnread = (item.unread_count || 0) > 0;

        return (
            <TouchableOpacity key={item.id} style={[styles.roomItem, isActive && styles.activeRoomItem]} onPress={() => router.push(`/(app)/chat/${item.id}` as any)}>
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <Text style={styles.placeholderText}>{displayName.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    {isActive && <View style={styles.activeStatusIndicator} />}
                </View>

                <View style={styles.roomInfo}>
                    <View style={styles.roomHeader}>
                        <Text style={[styles.roomName, isUnread && styles.roomNameUnread]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        {lastMessage && <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>{format(new Date(lastMessage.created_at || new Date()), "HH:mm", { locale: id })}</Text>}
                    </View>

                    <View style={styles.lastMessageContainer}>
                        <Text style={[styles.lastMessageText, isUnread && styles.lastMessageTextUnread]} numberOfLines={1}>
                            {lastMessage ? lastMessage.content : "Belum ada pesan"}
                        </Text>

                        {isActive && !isUnread && (
                            <View style={styles.activeTag}>
                                <Ionicons name="cube" size={10} color={COLORS.textSecondary} />
                                <Text style={styles.activeTagText}>Pickup Aktif</Text>
                            </View>
                        )}
                    </View>
                </View>

                {isUnread && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unread_count}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>Pesan 💬</Text>
                        <TouchableOpacity style={styles.newChatButton}>
                            <Ionicons name="pencil" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                        <TextInput style={styles.searchInput} placeholder="Cari nama driver..." placeholderTextColor={COLORS.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />} showsVerticalScrollIndicator={false}>
                {rooms.length === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                        <Text style={styles.emptyText}>Belum ada percakapan</Text>
                        <Text style={styles.emptySubText}>Percakapan akan muncul saat Anda menghubungi Kolektor atau CS.</Text>
                    </View>
                ) : (
                    <>
                        {activeRooms.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.pulseDot} />
                                    <Text style={styles.sectionTitle}>Pickup Aktif</Text>
                                </View>
                                {activeRooms.map((room) => renderRoomItem(room, true))}
                            </View>
                        )}

                        {historyRooms.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Riwayat Chat</Text>
                                </View>
                                {historyRooms.map((room) => renderRoomItem(room, false))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 20,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
    },
    newChatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        alignItems: "center",
        justifyContent: "center",
    },
    searchContainer: {
        position: "relative",
    },
    searchIcon: {
        position: "absolute",
        left: 16,
        top: 14,
        zIndex: 1,
    },
    searchInput: {
        width: "100%",
        backgroundColor: COLORS.background,
        paddingLeft: 44,
        paddingRight: 16,
        paddingVertical: 12,
        borderRadius: 16,
        fontSize: 14,
        fontFamily: "PublicSans-SemiBold",
        color: COLORS.text,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingLeft: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.lime,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: "PublicSans-Bold",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    roomItem: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "transparent",
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 8,
    },
    activeRoomItem: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: "rgba(86, 47, 176, 0.1)",
    },
    avatarContainer: {
        marginRight: 16,
        position: "relative",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "white",
    },
    placeholderAvatar: {
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 20,
        fontFamily: "PublicSans-Bold",
        color: COLORS.primary,
    },
    activeStatusIndicator: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 7,
    },
    roomInfo: {
        flex: 1,
        justifyContent: "center",
    },
    roomHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
        alignItems: "center",
    },
    roomName: {
        fontSize: 14,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    roomNameUnread: {
        color: COLORS.primary,
    },
    timeText: {
        fontSize: 10,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
    },
    timeTextUnread: {
        color: COLORS.primary,
        fontFamily: "PublicSans-Bold",
    },
    lastMessageContainer: {
        flexDirection: "column",
        alignItems: "flex-start",
    },
    lastMessageText: {
        fontSize: 12,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    lastMessageTextUnread: {
        color: COLORS.text,
        fontFamily: "PublicSans-Bold",
    },
    activeTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    activeTagText: {
        fontSize: 10,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
    },
    unreadBadge: {
        position: "absolute",
        top: 20,
        right: 16,
        backgroundColor: COLORS.primary,
        minWidth: 12,
        height: 12,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    unreadText: {
        color: "transparent",
        fontSize: 0,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
        textAlign: "center",
    },
});
