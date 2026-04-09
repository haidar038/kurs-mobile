import { COLORS } from "@/utils/constants";
import { useEffect } from "react";
import { Dimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SkeletonItem = ({ width, height, style }: { width: number | string; height: number; style?: any }) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }), withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })), -1, true);
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor: COLORS.border,
                    borderRadius: 8,
                },
                style,
                animatedStyle,
            ]}
        />
    );
};

export default function HomeSkeleton() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Header Skeleton */}
            <View
                style={{
                    paddingTop: 12,
                    paddingBottom: 4,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <SkeletonItem width={32} height={32} style={{ borderRadius: 16 }} />
                    <View style={{ gap: 4 }}>
                        <SkeletonItem width={60} height={10} />
                        <SkeletonItem width={120} height={14} />
                    </View>
                </View>
                <SkeletonItem width={40} height={40} style={{ borderRadius: 20 }} />
            </View>

            <View style={{ paddingHorizontal: 20 }}>
                {/* Hero Card Skeleton */}
                <View
                    style={{
                        borderRadius: 24,
                        marginBottom: 24,
                        overflow: "hidden",
                    }}
                >
                    <SkeletonItem width="100%" height={200} style={{ borderRadius: 24 }} />
                </View>

                {/* Main Menu Grid Skeleton */}
                <View style={{ marginBottom: 24 }}>
                    <SkeletonItem width={120} height={24} style={{ marginBottom: 16 }} />

                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                        <SkeletonItem width={(width - 52) / 2} height={120} style={{ borderRadius: 24 }} />
                        <SkeletonItem width={(width - 52) / 2} height={120} style={{ borderRadius: 24 }} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <SkeletonItem width={(width - 52) / 2} height={120} style={{ borderRadius: 24 }} />
                        <SkeletonItem width={(width - 52) / 2} height={120} style={{ borderRadius: 24 }} />
                    </View>
                </View>

                {/* Content Feed Skeleton */}
                <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
                        <SkeletonItem width={150} height={24} />
                        <SkeletonItem width={80} height={16} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 16, overflow: "hidden" }}>
                        <SkeletonItem width={240} height={180} style={{ borderRadius: 20 }} />
                        <SkeletonItem width={240} height={180} style={{ borderRadius: 20 }} />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
