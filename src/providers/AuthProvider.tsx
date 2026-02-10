import { supabase } from "@/lib/supabase";
import type { Collector, Profile } from "@/types/database";
import { Session, User } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type UserRole = NonNullable<Profile["role"]>;

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    collector: Collector | null;
    isLoading: boolean;
    desiredRole: UserRole | null; // The role the user IS ACTING AS currently
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [collector, setCollector] = useState<Collector | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [desiredRole, setDesiredRole] = useState<UserRole | null>(null);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

        if (!error && data) {
            setProfile(data);
            // Default desiredRole to their actual role if not set
            setDesiredRole((prev: UserRole | null) => {
                if (!prev) return data.role || "user";
                return prev;
            });

            // If collector, fetch collector data
            if (data.role === "collector") {
                const { data: collectorData } = await supabase.from("collectors").select("*").eq("user_id", userId).single();
                setCollector(collectorData);
            }
        }
        return data;
    }, []);

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setIsLoading(false);
        };

        initSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setCollector(null);
                setDesiredRole(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error ? new Error(error.message) : null };
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            return { error: new Error(error.message) };
        }

        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setCollector(null);
        setDesiredRole(null);
        router.replace("/(auth)/login");
    };

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    const switchRole = (role: UserRole) => {
        setDesiredRole(role);
        // Navigation logic should be handled by the consumer or a side effect in layout
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                collector,
                isLoading,
                desiredRole,
                signIn,
                signUp,
                signOut,
                refreshProfile,
                switchRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
