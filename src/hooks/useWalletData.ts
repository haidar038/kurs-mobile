import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useCallback, useEffect, useState } from "react";

import { WalletTransaction } from "@/types/database";

export const useWalletData = () => {
    const { user, profile } = useAuth();
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = useCallback(async () => {
        if (!user) return;
        
        try {
            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTransactions((data as WalletTransaction[]) || []);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTransactions();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel("wallet_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "wallet_transactions",
                    filter: `user_id=eq.${user?.id}`,
                },
                (payload) => {
                    fetchTransactions();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, fetchTransactions]);

    return {
        balance: profile?.balance || 0,
        points: profile?.points || 0,
        transactions,
        loading,
        refresh: fetchTransactions
    };
};
