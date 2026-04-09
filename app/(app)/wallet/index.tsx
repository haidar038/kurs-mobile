import { useWalletData } from "@/hooks/useWalletData";
import { WalletTransaction } from "@/types/database";
import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
    const router = useRouter();
    const { balance, points, transactions, loading, refresh } = useWalletData();

    const handleAction = (action: string) => {
        Alert.alert("Segera Hadir", `Fitur ${action} akan tersedia di update berikutnya.`);
    };

    const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
        const isIncome = item.type === "credit"; // Our schema says 'credit' / 'debit'

        let iconName: keyof typeof Ionicons.glyphMap = "cash-outline";
        let iconColor = COLORS.primary;
        let iconBg = COLORS.primaryLight;

        switch (item.category) {
            case "topup":
                iconName = "wallet";
                iconColor = "#2563EB"; // Blue
                iconBg = "#EFF6FF";
                break;
            case "payment":
                iconName = "cart";
                iconColor = COLORS.error; // Red
                iconBg = "#FEF2F2";
                break;
            case "reward":
                iconName = "leaf";
                iconColor = COLORS.success; // Green
                iconBg = "#F0FDF4";
                break;
            case "transfer":
                iconName = "swap-horizontal";
                iconColor = COLORS.warning; // Orange
                iconBg = "#FFFBEB";
                break;
            default:
                // Fallbacks if category is missing
                if (isIncome) {
                    iconName = "arrow-down";
                    iconColor = COLORS.success;
                    iconBg = "#F0FDF4";
                } else {
                    iconName = "arrow-up";
                    iconColor = COLORS.error;
                    iconBg = "#FEF2F2";
                }
                break;
        }

        return (
            <View style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.transactionTitle}>{item.description || "Transaksi"}</Text>
                    <Text style={styles.transactionTime}>{format(new Date(item.created_at), "d MMM yyyy, HH:mm", { locale: id })}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.transactionAmount, { color: isIncome ? COLORS.success : COLORS.text }]}>
                        {isIncome ? "+" : "-"}Rp {item.amount.toLocaleString("id-ID")}
                    </Text>
                    {item.category === "reward" && <Text style={styles.transactionEstimate}>+{(item.amount / 10).toLocaleString("id-ID")} Poin</Text>}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Dompet Saya 💳</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransactionItem}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                ListHeaderComponent={
                    <View style={{ gap: 24, marginBottom: 24 }}>
                        {/* 1. MAIN CARD (Saldo) */}
                        <View style={styles.mainCard}>
                            <View style={styles.mainCardDecor1} />

                            <View style={styles.mainCardContent}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                                    <View>
                                        <Text style={styles.balanceLabel}>Saldo JagaPay</Text>
                                        <Text style={styles.balanceValue}>Rp {balance.toLocaleString("id-ID")}</Text>
                                    </View>
                                    <View style={styles.walletIconContainer}>
                                        <Ionicons name="wallet" size={20} color={COLORS.lime} />
                                    </View>
                                </View>

                                <View style={styles.mainCardActions}>
                                    <TouchableOpacity onPress={() => handleAction("Top Up")} style={styles.primaryActionButton}>
                                        <Ionicons name="add" size={16} color={COLORS.primary} />
                                        <Text style={styles.primaryActionText}>Top Up</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => handleAction("Riwayat")} style={styles.secondaryActionButton}>
                                        <Ionicons name="time" size={16} color="white" />
                                        <Text style={styles.secondaryActionText}>History</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* 2. SECONDARY CARD (Eco Points) */}
                        <View style={styles.pointsCard}>
                            <View style={styles.pointsContent}>
                                <Text style={styles.pointsLabel}>ECO-POINTS</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                    <Text style={styles.pointsValue}>{points.toLocaleString("id-ID")}</Text>
                                    <Ionicons name="star" size={20} color="#FBBF24" />
                                </View>
                                <Text style={styles.pointsEstimate}>Setara Rp {points.toLocaleString("id-ID")}</Text>
                            </View>

                            <TouchableOpacity onPress={() => handleAction("Tukar Poin")} style={styles.pointsButton}>
                                <Text style={styles.pointsButtonText}>Tukar Poin</Text>
                                <Ionicons name="chevron-forward" size={16} color="white" />
                            </TouchableOpacity>

                            <Ionicons name="leaf" size={100} color="rgba(86, 47, 176, 0.05)" style={styles.pointsDecor} />
                        </View>

                        {/* 3. ACTIONS GRID */}
                        <View>
                            <Text style={styles.sectionSubtitle}>LAYANAN KEUANGAN</Text>
                            <View style={styles.gridContainer}>
                                <TouchableOpacity onPress={() => handleAction("Transfer")} style={styles.gridItem}>
                                    <View style={[styles.gridIcon, { backgroundColor: "#EFF6FF", color: "#2563EB" }]}>
                                        <Ionicons name="business" size={24} color="#2563EB" />
                                    </View>
                                    <Text style={styles.gridLabel}>Transfer</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleAction("Bayar")} style={styles.gridItem}>
                                    <View style={[styles.gridIcon, { backgroundColor: "#F0FDF4", color: COLORS.success }]}>
                                        <Ionicons name="qr-code" size={24} color={COLORS.success} />
                                    </View>
                                    <Text style={styles.gridLabel}>Bayar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleAction("Voucher")} style={styles.gridItem}>
                                    <View style={[styles.gridIcon, { backgroundColor: "#FFF7ED", color: "#EA580C" }]}>
                                        <Ionicons name="ticket" size={24} color="#EA580C" />
                                    </View>
                                    <Text style={styles.gridLabel}>Voucher</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleAction("Lainnya")} style={styles.gridItem}>
                                    <View style={[styles.gridIcon, { backgroundColor: COLORS.primaryLight, color: COLORS.primary }]}>
                                        <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.gridLabel}>Lainnya</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 4. TRANSACTION HISTORY HEADER */}
                        <View style={styles.historyHeader}>
                            <Text style={styles.sectionSubtitle}>TRANSAKSI TERAKHIR</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>Lihat Semua</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
                        <Text style={styles.emptyText}>Belum ada transaksi</Text>
                    </View>
                }
            />
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
    navBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },

    // Main Card
    mainCard: {
        backgroundColor: COLORS.text, // Dark similar to brand-dark
        borderRadius: 24,
        padding: 24,
        position: "relative",
        overflow: "hidden",
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    mainCardDecor1: {
        position: "absolute",
        right: -40,
        top: -40,
        width: 160,
        height: 160,
        backgroundColor: COLORS.primary,
        borderRadius: 80,
        opacity: 0.5,
    },
    mainCardContent: {
        position: "relative",
        zIndex: 10,
    },
    balanceLabel: {
        fontSize: 12,
        fontFamily: "PublicSans-Medium",
        color: "rgba(255,255,255,0.7)",
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 32,
        fontFamily: "PublicSans-Bold",
        color: "white",
        letterSpacing: -1,
    },
    walletIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    mainCardActions: {
        flexDirection: "row",
        gap: 12,
    },
    primaryActionButton: {
        flex: 1,
        backgroundColor: COLORS.lime,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    primaryActionText: {
        fontSize: 12,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
    },
    secondaryActionButton: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    secondaryActionText: {
        fontSize: 12,
        fontFamily: "PublicSans-Bold",
        color: "white",
    },

    // Points Card
    pointsCard: {
        backgroundColor: "#F4F1FA", // brand-light
        borderWidth: 1,
        borderColor: "rgba(86, 47, 176, 0.2)",
        borderRadius: 24,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
    },
    pointsContent: {
        position: "relative",
        zIndex: 10,
    },
    pointsLabel: {
        fontSize: 10,
        fontFamily: "PublicSans-Bold",
        color: COLORS.primary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    pointsValue: {
        fontSize: 24,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
    },
    pointsEstimate: {
        fontSize: 10,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
    },
    pointsButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
    },
    pointsButtonText: {
        fontSize: 12,
        fontFamily: "PublicSans-Bold",
        color: "white",
    },
    pointsDecor: {
        position: "absolute",
        right: -16,
        bottom: -16,
        transform: [{ rotate: "-15deg" }],
    },

    // Grid Actions
    gridContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    gridItem: {
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "transparent",
    },
    gridIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    gridLabel: {
        fontSize: 10,
        fontFamily: "PublicSans-Bold",
        color: COLORS.textSecondary,
    },

    // Headers
    sectionSubtitle: {
        fontSize: 10,
        fontFamily: "PublicSans-Bold",
        color: COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 8,
    },
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    seeAllText: {
        fontSize: 10,
        fontFamily: "PublicSans-Bold",
        color: COLORS.primary,
        marginBottom: 12,
    },

    // Transaction History
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    transactionTitle: {
        fontSize: 14,
        fontFamily: "PublicSans-Bold",
        color: COLORS.text,
        marginBottom: 4,
    },
    transactionTime: {
        fontSize: 10,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
    },
    transactionAmount: {
        fontSize: 14,
        fontFamily: "PublicSans-Bold",
    },
    transactionEstimate: {
        fontSize: 10,
        fontFamily: "PublicSans-Medium",
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: "PublicSans-Medium",
    },
});
