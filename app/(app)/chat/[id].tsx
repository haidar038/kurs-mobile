import { useChatMessages } from "@/hooks/useChat";
import { useAuth } from "@/providers/AuthProvider";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bubble, GiftedChat, IMessage, Send } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams();
    const roomId = typeof id === "string" ? id : "";
    const router = useRouter();
    const { user, profile } = useAuth();
    const { messages: dbMessages, loading, sendMessage } = useChatMessages(roomId);

    // Transform DB messages to GiftedChat format
    const formattedMessages: IMessage[] = dbMessages.map((msg) => ({
        _id: msg.id,
        text: msg.content,
        createdAt: new Date(msg.created_at || new Date()),
        user: {
            _id: msg.sender_id || "",
            name: msg.sender_id === user?.id ? "Me" : "Other", // Ideally fetch name
        },
    }));

    const onSend = useCallback(
        async (newMessages: IMessage[] = []) => {
            if (newMessages.length > 0 && user) {
                const message = newMessages[0];
                try {
                    await sendMessage(message.text, user.id);
                } catch (error) {
                    console.error("Failed to send message", error);
                    alert("Gagal mengirim pesan");
                }
            }
        },
        [user, sendMessage],
    );

    if (!user) return null;

    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: COLORS.primary,
                    },
                    left: {
                        backgroundColor: "#F3F4F6",
                    },
                }}
                textStyle={{
                    right: {
                        color: "white",
                        fontFamily: "PublicSans-Regular",
                    },
                    left: {
                        color: COLORS.text,
                        fontFamily: "PublicSans-Regular",
                    },
                }}
            />
        );
    };

    const renderSend = (props: any) => {
        return (
            <Send {...props}>
                <View style={styles.sendingContainer}>
                    <Ionicons name="send" size={24} color={COLORS.primary} />
                </View>
            </Send>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <SafeAreaView edges={["top"]} style={styles.header}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Percakapan</Text>
                        <Text style={styles.headerSubtitle}>Online</Text>
                    </View>
                    <TouchableOpacity style={styles.optionButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <GiftedChat
                    messages={formattedMessages}
                    onSend={(messages) => onSend(messages)}
                    user={{
                        _id: user.id,
                        name: profile?.full_name || "User",
                    }}
                    renderBubble={renderBubble}
                    renderSend={renderSend}
                    textInputProps={{
                        placeholder: "Ketik pesan...",
                    }}
                    isScrollToBottomEnabled
                    isSendButtonAlwaysVisible
                    maxComposerHeight={100}
                    messagesContainerStyle={{
                        paddingBottom: 20,
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    header: {
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    navBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 12,
        fontFamily: "PublicSans-Regular",
        color: COLORS.success,
        textAlign: "center",
    },
    optionButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    sendingContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        marginBottom: 10,
    },
});
