export const WASTE_TYPES = [
    { id: "organic", label: "Organik", icon: "🍃" },
    { id: "plastic", label: "Plastik", icon: "♻️" },
    { id: "paper", label: "Kertas", icon: "📄" },
    { id: "metal", label: "Logam", icon: "🔩" },
    { id: "glass", label: "Kaca", icon: "🫙" },
    { id: "electronic", label: "Elektronik", icon: "📱" },
    { id: "hazardous", label: "B3 (Berbahaya)", icon: "☢️" },
    { id: "other", label: "Lainnya", icon: "📦" },
] as const;

export const MINIMUM_FEE = 10000; // Rp10,000

export const VOLUME_OPTIONS = [
    { id: "small", label: "Kecil", description: "1-2 kantong plastik", fee: 10000, icon: "📦" },
    { id: "medium", label: "Sedang", description: "3-5 kantong plastik", fee: 25000, icon: "🛍️" },
    { id: "large", label: "Besar", description: "6-10 kantong plastik", fee: 50000, icon: "🚛" },
    { id: "extra_large", label: "Ekstra Besar", description: ">10 kantong plastik", fee: 100000, icon: "🏗️" },
] as const;

export const PICKUP_STATUS_LABELS = {
    requested: "Menunggu",
    assigned: "Kurir Ditugaskan",
    en_route: "Kurir Dalam Perjalanan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
} as const;

export const COLORS = {
    primary: "#562FB0", // 
    primaryLight: "#EAE6F3", // emerald-500
    primaryDark: "#059669", // emerald-600
    secondary: "#3B82F6", // blue-500
    background: "#F9FAFB",
    surface: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    lime: "#E1FF00",
    error: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
} as const;
