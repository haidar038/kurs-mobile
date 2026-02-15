export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1";
    };
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    public: {
        Tables: {
            articles: {
                Row: {
                    author_id: string | null;
                    category: string | null;
                    content: string;
                    cover_image: string | null;
                    created_at: string | null;
                    id: string;
                    published: boolean | null;
                    tags: string[] | null;
                    title: string;
                };
                Insert: {
                    author_id?: string | null;
                    category?: string | null;
                    content: string;
                    cover_image?: string | null;
                    created_at?: string | null;
                    id?: string;
                    published?: boolean | null;
                    tags?: string[] | null;
                    title: string;
                };
                Update: {
                    author_id?: string | null;
                    category?: string | null;
                    content?: string;
                    cover_image?: string | null;
                    created_at?: string | null;
                    id?: string;
                    published?: boolean | null;
                    tags?: string[] | null;
                    title?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "articles_author_id_fkey";
                        columns: ["author_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
            bookmarks: {
                Row: {
                    article_id: string | null;
                    created_at: string | null;
                    id: string;
                    user_id: string | null;
                };
                Insert: {
                    article_id?: string | null;
                    created_at?: string | null;
                    id?: string;
                    user_id?: string | null;
                };
                Update: {
                    article_id?: string | null;
                    created_at?: string | null;
                    id?: string;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "bookmarks_article_id_fkey";
                        columns: ["article_id"];
                        isOneToOne: false;
                        referencedRelation: "articles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookmarks_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
            collectors: {
                Row: {
                    created_at: string | null;
                    current_location: Json | null;
                    id: string;
                    license_plate: string | null;
                    status: string | null;
                    user_id: string | null;
                    vehicle_type: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    current_location?: Json | null;
                    id?: string;
                    license_plate?: string | null;
                    status?: string | null;
                    user_id?: string | null;
                    vehicle_type?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    current_location?: Json | null;
                    id?: string;
                    license_plate?: string | null;
                    status?: string | null;
                    user_id?: string | null;
                    vehicle_type?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "collectors_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
            deposits: {
                Row: {
                    created_at: string | null;
                    depositor_id: string | null;
                    id: string;
                    notes: string | null;
                    photos: string[] | null;
                    status: string | null;
                    verified_by: string | null;
                    waste_bank_id: string | null;
                    waste_type: string;
                    weight: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    depositor_id?: string | null;
                    id?: string;
                    notes?: string | null;
                    photos?: string[] | null;
                    status?: string | null;
                    verified_by?: string | null;
                    waste_bank_id?: string | null;
                    waste_type: string;
                    weight?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    depositor_id?: string | null;
                    id?: string;
                    notes?: string | null;
                    photos?: string[] | null;
                    status?: string | null;
                    verified_by?: string | null;
                    waste_bank_id?: string | null;
                    waste_type?: string;
                    weight?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "deposits_depositor_id_fkey";
                        columns: ["depositor_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "deposits_verified_by_fkey";
                        columns: ["verified_by"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "deposits_waste_bank_id_fkey";
                        columns: ["waste_bank_id"];
                        isOneToOne: false;
                        referencedRelation: "facilities";
                        referencedColumns: ["id"];
                    },
                ];
            };
            facilities: {
                Row: {
                    address: string | null;
                    contact: string | null;
                    created_at: string | null;
                    id: string;
                    location: Json | null;
                    name: string;
                    opening_hours: Json | null;
                    type: string;
                };
                Insert: {
                    address?: string | null;
                    contact?: string | null;
                    created_at?: string | null;
                    id?: string;
                    location?: Json | null;
                    name: string;
                    opening_hours?: Json | null;
                    type: string;
                };
                Update: {
                    address?: string | null;
                    contact?: string | null;
                    created_at?: string | null;
                    id?: string;
                    location?: Json | null;
                    name?: string;
                    opening_hours?: Json | null;
                    type?: string;
                };
                Relationships: [];
            };
            payments: {
                Row: {
                    amount: number;
                    created_at: string | null;
                    id: string;
                    method: string | null;
                    pickup_request_id: string | null;
                    status: string | null;
                };
                Insert: {
                    amount: number;
                    created_at?: string | null;
                    id?: string;
                    method?: string | null;
                    pickup_request_id?: string | null;
                    status?: string | null;
                };
                Update: {
                    amount?: number;
                    created_at?: string | null;
                    id?: string;
                    method?: string | null;
                    pickup_request_id?: string | null;
                    status?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "payments_pickup_request_id_fkey";
                        columns: ["pickup_request_id"];
                        isOneToOne: false;
                        referencedRelation: "pickup_requests";
                        referencedColumns: ["id"];
                    },
                ];
            };
            pickup_requests: {
                Row: {
                    address: string | null;
                    collector_id: string | null;
                    created_at: string | null;
                    fee: number | null;
                    id: string;
                    location: Json;
                    notes: string | null;
                    photos: string[] | null;
                    scheduled_at: string | null;
                    status: string | null;
                    updated_at: string | null;
                    user_id: string | null;
                    volume_estimate: string | null;
                    waste_types: string[];
                };
                Insert: {
                    address?: string | null;
                    collector_id?: string | null;
                    created_at?: string | null;
                    fee?: number | null;
                    id?: string;
                    location: Json;
                    notes?: string | null;
                    photos?: string[] | null;
                    scheduled_at?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                    volume_estimate?: string | null;
                    waste_types: string[];
                };
                Update: {
                    address?: string | null;
                    collector_id?: string | null;
                    created_at?: string | null;
                    fee?: number | null;
                    id?: string;
                    location?: Json;
                    notes?: string | null;
                    photos?: string[] | null;
                    scheduled_at?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                    volume_estimate?: string | null;
                    waste_types?: string[];
                };
                Relationships: [
                    {
                        foreignKeyName: "pickup_requests_collector_id_fkey";
                        columns: ["collector_id"];
                        isOneToOne: false;
                        referencedRelation: "collectors";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "pickup_requests_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
            profiles: {
                Row: {
                    avatar_url: string | null;
                    created_at: string | null;
                    facility_id: string | null;
                    full_name: string | null;
                    id: string;
                    phone: string | null;
                    region_id: string | null;
                    role: Database["public"]["Enums"]["user_role"] | null;
                };
                Insert: {
                    avatar_url?: string | null;
                    created_at?: string | null;
                    facility_id?: string | null;
                    full_name?: string | null;
                    id: string;
                    phone?: string | null;
                    region_id?: string | null;
                    role?: Database["public"]["Enums"]["user_role"] | null;
                };
                Update: {
                    avatar_url?: string | null;
                    created_at?: string | null;
                    facility_id?: string | null;
                    full_name?: string | null;
                    id?: string;
                    phone?: string | null;
                    region_id?: string | null;
                    role?: Database["public"]["Enums"]["user_role"] | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "profiles_facility_id_fkey";
                        columns: ["facility_id"];
                        isOneToOne: false;
                        referencedRelation: "facilities";
                        referencedColumns: ["id"];
                    },
                ];
            };
            user_roles: {
                Row: {
                    created_at: string | null;
                    id: string;
                    role: Database["public"]["Enums"]["user_role"];
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    role: Database["public"]["Enums"]["user_role"];
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    role?: Database["public"]["Enums"]["user_role"];
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "user_roles_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
            role_applications: {
                Row: {
                    created_at: string | null;
                    id: string;
                    metadata: Json | null;
                    requested_role: Database["public"]["Enums"]["user_role"];
                    status: string;
                    updated_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    requested_role: Database["public"]["Enums"]["user_role"];
                    status?: string;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    requested_role?: Database["public"]["Enums"]["user_role"];
                    status?: string;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "role_applications_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_user_role: {
                Args: never;
                Returns: Database["public"]["Enums"]["user_role"];
            };
            is_admin: { Args: never; Returns: boolean };
        };
        Enums: {
            user_role: "guest" | "user" | "collector" | "waste_bank_staff" | "facility_admin" | "operator" | "support" | "admin";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
    DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
      ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            user_role: ["guest", "user", "collector", "waste_bank_staff", "facility_admin", "operator", "support", "admin"],
        },
    },
} as const;

// ── Convenience type aliases ──────────────────────────────────────────
export type Article = Tables<"articles">;
export type Bookmark = Tables<"bookmarks">;
export type Collector = Tables<"collectors">;
export type Deposit = Tables<"deposits">;
export type Facility = Tables<"facilities">;
export type Payment = Tables<"payments">;
export type PickupRequest = Tables<"pickup_requests">;
export type Profile = Tables<"profiles">;
