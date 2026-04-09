import { COLORS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
            {/* Background Layer with Shadow */}
            <View style={styles.background} />

            <View style={styles.tabContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: "tabLongPress",
                            target: route.key,
                        });
                    };

                    // Define icons based on route name
                    const getIcon = (name: string, focused: boolean) => {
                        const color = focused ? COLORS.primary : "#94A3B8";
                        const size = 24;

                        switch (name) {
                            case "home":
                                return <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />;
                            case "facilities":
                                return <Ionicons name={focused ? "map" : "map-outline"} size={size} color={color} />;
                            case "scan":
                                // Special handling for center icon
                                return <Ionicons name="scan" size={28} color="white" />;
                            case "history":
                                return <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />;
                            case "profile":
                                return <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />;
                            default:
                                return <Ionicons name="help-circle" size={size} color={color} />;
                        }
                    };

                    // Center Button (Route at index 2: facilities)
                    if (index === 2) {
                        return (
                            <View key={route.key} style={styles.centerButtonWrapper}>
                                <TouchableOpacity activeOpacity={0.8} onPress={onPress} onLongPress={onLongPress} style={styles.centerButton}>
                                    <View style={styles.centerButtonContent}>{getIcon(route.name, isFocused)}</View>
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                        >
                            {getIcon(route.name, isFocused)}
                            <Text style={[styles.label, { color: isFocused ? COLORS.primary : "#94A3B8" }]}>{label as string}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Position relative by default so it sits at the bottom of the layout flow
        // position: "absolute",
        // bottom: 0,
        // left: 0,
        // right: 0,
    },
    background: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.05,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        // paddingHorizontal: 16,
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
    },
    label: {
        fontSize: 10,
        fontFamily: "PublicSans-Bold",
        marginTop: 4,
    },
    centerButtonWrapper: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -30, // Float up
    },
    centerButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#562FB0",
        outlineStyle: "solid",
        outlineWidth: 6,
        outlineColor: "white",
        alignItems: "center",
        justifyContent: "center",
    },
    centerButtonContent: {
        alignItems: "center",
        justifyContent: "center",
    },
});
