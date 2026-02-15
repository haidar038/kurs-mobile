import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import type { Collector, Profile } from "@/types/database";
import { Session, User } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type UserRole = NonNullable<Profile["role"]>;

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    collector: Collector | null;
    roles: UserRole[]; // All roles the user has in DB
    isLoading: boolean;
    desiredRole: UserRole | null; // The role the user IS ACTING AS currently
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signOut: (redirectPath?: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    switchRole: (role: UserRole) => void;
    hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [collector, setCollector] = useState<Collector | null>(null);
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [desiredRole, setDesiredRole] = useState<UserRole | null>(null);
    const profileRef = useRef<Profile | null>(null);

    // Keep profileRef in sync
    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

            if (error || !data) {
                console.error("Error fetching profile:", error);
                return null;
            }

            setProfile(data);

            // Fetch Multiple Roles from user_roles table
            const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", userId);
            // Safe access to data.role
            const defaultRole = data.role || "user";
            const userRoles = (rolesData?.map((r) => r.role) as UserRole[]) || [defaultRole];
            setRoles(userRoles);

            // Default desiredRole
            setDesiredRole((prev: UserRole | null) => {
                if (!prev) return defaultRole as UserRole;
                return prev;
            });

            // If collector, fetch collector data
            if (userRoles.includes("collector")) {
                const { data: collectorData } = await supabase.from("collectors").select("*").eq("user_id", userId).single();
                setCollector(collectorData);
            }
            return data;
        } catch (error) {
            console.error("Unexpected error in fetchProfile:", error);
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // Get initial session
        const initSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) console.error("Error getting session:", error);

                if (mounted) {
                    if (session?.user) {
                        const profileData = await fetchProfile(session.user.id);
                        if (!profileData) {
                            console.error("Profile not found or fetch failed. Clearing session.");
                            setSession(null);
                            // Optionally call signOut to clean up Supabase state if possible,
                            // but setSession(null) is enough to unblock UI.
                            await supabase.auth.signOut().catch(console.error);
                        } else {
                            setSession(session);
                        }
                    } else {
                        setSession(session);
                    }
                }
            } catch (error) {
                console.error("Critical error in initSession:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state change event:", event);
            if (!mounted) return;

            if (session?.user) {
                // Optimistically set session to avoid flash
                setSession(session);

                // If we already have a profile and the event is just a USER_UPDATED (like push token update),
                // we might not need to fetch the profile again from the 'profiles' table.
                if (event === "USER_UPDATED" && profileRef.current) {
                    console.log("User metadata updated, skipping profile re-fetch.");
                } else {
                    const profileData = await fetchProfile(session.user.id);
                    if (!profileData) {
                        console.error("Profile load failed on auth change. Logging out.");
                        setSession(null);
                        setProfile(null);
                        setCollector(null);
                        setDesiredRole(null);
                        setRoles([]);
                        await supabase.auth.signOut().catch(console.error);
                    }
                }
            } else {
                setSession(session);
                setProfile(null);
                setCollector(null);
                setDesiredRole(null);
                setRoles([]);
            }
            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
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

    const setOfflineStatus = async (userId: string) => {
        try {
            await supabase.from("collectors").update({ status: "offline" }).eq("user_id", userId);
        } catch (error) {
            console.error("Error setting offline status:", error);
        }
    };

    const signOut = async (redirectPath?: string) => {
        setIsLoading(true);
        try {
            const {
                data: { user: currentUser },
            } = await supabase.auth.getUser();
            const userId = currentUser?.id ?? session?.user?.id;

            // Log for debugging (visible to user in console)
            console.log("Signing out user:", userId);

            if (userId) {
                // If it's a collector (check both profile role and collector state)
                const isCollector = profile?.role === "collector" || collector !== null;
                if (isCollector) {
                    try {
                        await supabase.from("collectors").update({ status: "offline" }).eq("user_id", userId);
                        console.log("Set collector status to offline for:", userId);
                    } catch (e) {
                        console.warn("Failed to set offline status:", e);
                    }
                }
            }

            await supabase.auth.signOut();
            queryClient.clear();
            setSession(null);
            setProfile(null);
            setCollector(null);
            setRoles([]);
            setDesiredRole(null);

            // Redirect to the provided path or default login
            if (redirectPath) {
                router.replace(redirectPath as any);
            } else {
                router.replace("/(auth)/login");
            }
        } catch (error) {
            console.error("Error during signOut:", error);
            // Force safe state even if error
            setSession(null);
            setProfile(null);
            router.replace("/(auth)/login");
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    const switchRole = async (role: UserRole) => {
        // If switching from collector to user, set status to offline
        if (desiredRole === "collector" && role === "user" && session?.user) {
            await setOfflineStatus(session.user.id);
            // Refresh collector status locally
            const { data } = await supabase.from("collectors").select("*").eq("user_id", session.user.id).single();
            setCollector(data);
        }
        setDesiredRole(role);
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                collector,
                roles,
                isLoading,
                desiredRole,
                signIn,
                signUp,
                signOut,
                refreshProfile,
                switchRole,
                hasRole: (role: UserRole) => roles.includes(role),
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
