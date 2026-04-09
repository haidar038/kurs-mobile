import { useLocationService } from "@/hooks/useLocationService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Database } from "@/types/database";
import { calculateCarbonSaved } from "@/utils/emissions";
import { getBadgeCount } from "@/utils/notifications";
import { useEffect, useRef, useState } from "react";

type Article = Database["public"]["Tables"]["articles"]["Row"];
type PickupRequest = Database["public"]["Tables"]["pickup_requests"]["Row"] & {
    collector: Database["public"]["Tables"]["collectors"]["Row"] & {
        profile: Database["public"]["Tables"]["profiles"]["Row"];
    };
};

export function useHomeData() {
    const { session } = useAuth();
    const { locationName, fetchLocation: refreshLocation } = useLocationService();

    const [stats, setStats] = useState({
        totalWeight: 0,
        points: 0,
        carbonSaved: 0,
        totalDeposits: 0,
    });
    const [activePickup, setActivePickup] = useState<PickupRequest | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

    const userId = session?.user?.id;

    // Keep a stable ref to refreshLocation so the useEffect doesn't re-run
    // every render even if the callback reference changes.
    const refreshLocationRef = useRef(refreshLocation);
    useEffect(() => {
        refreshLocationRef.current = refreshLocation;
    }, [refreshLocation]);

    useEffect(() => {
        if (!userId) return;

        // 1. Fetch Main Data (Blocking UI)
        const fetchMainData = async () => {
            try {
                setLoading(true);

                // Fetch User Stats
                const { data: deposits, error: depositsError } = await supabase
                    .from("deposits")
                    .select("weight, status, waste_type")
                    .eq("depositor_id", userId);

                if (depositsError) throw depositsError;

                const validDeposits =
                    deposits?.filter(
                        (d) => d.status === "verified" || d.status === "completed"
                    ) || [];
                
                const totalWeight = validDeposits.reduce(
                    (sum, d) => sum + (d.weight || 0),
                    0
                );

                const points = totalWeight * 10;
                
                // Technical Carbon Calculation
                const carbonSaved = validDeposits.reduce(
                    (sum, d) => sum + calculateCarbonSaved(d.waste_type, d.weight || 0),
                    0
                );

                setStats({
                    totalWeight,
                    points,
                    carbonSaved,
                    totalDeposits: deposits?.length || 0,
                });

                // Fetch Active Pickup
                const { data: pickups, error: pickupError } = await supabase
                    .from("pickup_requests")
                    .select(`
                        *,
                        collector:collectors (
                            *,
                            profile:profiles (*)
                        )
                    `)
                    .eq("user_id", userId)
                    .in("status", ["requested", "assigned", "en_route"])
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (pickupError) throw pickupError;

                // @ts-ignore
                setActivePickup(pickups?.[0] ?? null);

                // Fetch Articles
                const { data: articlesData, error: articlesError } = await supabase
                    .from("articles")
                    .select("*")
                    .eq("published", true)
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (articlesError) throw articlesError;

                setArticles(articlesData || []);
            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        // 2. Check Notifications (Non-blocking)
        const checkNotifications = async () => {
            try {
                const count = await getBadgeCount();
                setHasUnreadNotifications(count > 0);
            } catch (error) {
                console.log("Error checking notification badge:", error);
            }
        };

        fetchMainData();
        refreshLocationRef.current(); // Stable ref — won't re-trigger useEffect
        checkNotifications();

        // Only re-run when the authenticated user changes, NOT when refreshLocation changes.
    }, [userId]);

    return {
        stats,
        activePickup,
        articles,
        loading,
        locationName,
        hasUnreadNotifications,
        refreshLocation,
    };
}
