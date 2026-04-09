import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { ChatRoom, Message, Profile } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

export interface ChatRoomWithParticipants extends ChatRoom {
    participants: {
        user: Profile;
    }[];
    last_message?: Message;
    unread_count?: number;
}

export const useChatRooms = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<ChatRoomWithParticipants[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = useCallback(async () => {
        if (!user) return;

        try {
            // 1. Get rooms where user is a participant
            const { data: participantData, error: participantError } = await supabase
                .from("chat_participants")
                .select("room_id")
                .eq("user_id", user.id);

            if (participantError) throw participantError;

            const roomIds = participantData.map((p) => p.room_id);

            if (roomIds.length === 0) {
                setRooms([]);
                setLoading(false);
                return;
            }

            // 2. Fetch room details with participants and messages
            const { data: roomsData, error: roomsError } = await supabase
                .from("chat_rooms")
                .select("*")
                .in("id", roomIds)
                .order("updated_at", { ascending: false });

            if (roomsError) throw roomsError;

            const enrichedRooms = await Promise.all(
                roomsData.map(async (room) => {
                    // Fetch other participants
                    const { data: participants } = await supabase
                        .from("chat_participants")
                        .select("user:profiles(*)")
                        .eq("room_id", room.id)
                        .neq("user_id", user.id); // Get OTHER users

                    // Fetch last message
                    const { data: messages } = await supabase
                        .from("messages")
                        .select("*")
                        .eq("room_id", room.id)
                        .order("created_at", { ascending: false })
                        .limit(1);

                    // Fetch unread count
                    const { count: unreadCount } = await supabase
                        .from("messages")
                        .select("*", { count: "exact", head: true })
                        .eq("room_id", room.id)
                        .neq("sender_id", user.id)
                        .is("read_at", null);

                    return {
                        ...room,
                        participants: participants || [],
                        last_message: messages?.[0],
                        unread_count: unreadCount || 0
                    } as ChatRoomWithParticipants;
                })
            );

            setRooms(enrichedRooms);

        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRooms();
        
        // Subscribe to new messages to update room list sorting/preview
        const subscription = supabase
            .channel("public:messages")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                () => fetchRooms()
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, fetchRooms]);

    return { rooms, loading, refresh: fetchRooms };
};

export const useChatMessages = (roomId: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("room_id", roomId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    const sendMessage = async (content: string, senderId: string) => {
        try {
            const { error } = await supabase.from("messages").insert({
                room_id: roomId,
                sender_id: senderId,
                content: content,
            });

            if (error) throw error;
            
            // Update room's updated_at
            await supabase
                .from("chat_rooms")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", roomId);

        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (!roomId) return;
        
        fetchMessages();

        const subscription = supabase
            .channel(`room:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    setMessages((prev) => [payload.new as Message, ...prev]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [roomId, fetchMessages]);

    return { messages, loading, sendMessage };
};
