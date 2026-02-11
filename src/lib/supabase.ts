import type { Database } from "@/types/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter that handles Web/SSR and Native
const ExpoStorage = {
    getItem: (key: string) => {
        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.localStorage) {
                return window.localStorage.getItem(key);
            }
            return null;
        }
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
            return;
        }
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(key);
            }
            return;
        }
        return AsyncStorage.removeItem(key);
    },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
