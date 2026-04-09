import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
interface AnimatedSplashScreenProps {
    onAnimationFinish?: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onAnimationFinish }) => {
    // Shared values for animations
    const floatValue = useSharedValue(0);
    const orbitRotation = useSharedValue(0);
    const progressWidth = useSharedValue(0);
    const pulseValue = useSharedValue(0);
    const fadeOutValue = useSharedValue(1);

    useEffect(() => {
        // Hide native splash screen as soon as Animated JS Splash is mounted
        SplashScreen.hideAsync().catch(() => {});

        // 1. Floating animation
        floatValue.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true);

        // 2. Orbit rotation animation
        orbitRotation.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1, false);

        // 3. Pulse animation for background glow
        pulseValue.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);

        // 4. Progress bar fill
        progressWidth.value = withTiming(100, {
            duration: 2500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });

        // 5. Trigger finish after simulated loading time (e.g., 3 seconds)
        const timer = setTimeout(() => {
            // Fade out the entire splash screen
            fadeOutValue.value = withTiming(0, { duration: 500, easing: Easing.ease }, () => {
                if (onAnimationFinish) {
                    onAnimationFinish();
                }
            });
        }, 3000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Animated styles
    const floatStyle = useAnimatedStyle(() => {
        const translateY = interpolate(floatValue.value, [0, 1], [0, -10]);
        return { transform: [{ translateY }] };
    });

    const orbitStyle1 = useAnimatedStyle(() => {
        return {
            transform: [{ rotateX: "70deg" }, { rotateY: "15deg" }, { rotateZ: `${orbitRotation.value}deg` }],
        };
    });

    const orbitStyle2 = useAnimatedStyle(() => {
        return {
            transform: [{ rotateX: "70deg" }, { rotateY: "-30deg" }, { rotateZ: `-${orbitRotation.value}deg` }],
        };
    });

    const progressStyle = useAnimatedStyle(() => {
        return { width: `${progressWidth.value}%` };
    });

    const pulseStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(pulseValue.value, [0, 1], [0.1, 0.3]),
            transform: [{ scale: interpolate(pulseValue.value, [0, 1], [0.95, 1.05]) }],
        };
    });

    const containerOpacityStyle = useAnimatedStyle(() => {
        return { opacity: fadeOutValue.value };
    });

    return (
        <Animated.View style={[styles.container, containerOpacityStyle]}>
            {/* Background Effects */}
            <Animated.View style={[styles.glowPurple, pulseStyle]}>
                <LinearGradient colors={["rgba(106, 13, 173, 0.8)", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
            </Animated.View>
            <View style={styles.glowLime} />

            {/* LOGO CONTAINER */}
            <Animated.View style={[styles.logoContainer, floatStyle]}>
                {/* Planet (Central Sphere) */}
                <View style={[styles.planet, { overflow: "hidden" }]}>
                    <LinearGradient
                        colors={["#6A0DAD", "#4A0082"]} // from-brand-purple to-purple-900
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Planet details mock */}
                    <View style={[styles.continent, { top: 8, left: 16, width: 48, height: 32 }]} />
                    <View style={[styles.continent, { bottom: 16, right: 24, width: 32, height: 24 }]} />
                    <View style={styles.planetBorder} />
                </View>

                {/* Orbit Ring 1 (Lime) */}
                <Animated.View style={[styles.orbitRing, styles.orbitLime, orbitStyle1]}>
                    <View style={styles.orbitParticle} />
                </Animated.View>

                {/* Orbit Ring 2 (Faint Purple/White) */}
                <Animated.View style={[styles.orbitRing, styles.orbitFaint, orbitStyle2]} />
            </Animated.View>

            {/* TEXT BRANDING */}
            <View style={styles.textContainer}>
                <Text style={styles.title}>JAGA BUMI</Text>
                <Text style={styles.subtitle}>Langkah Kecil, Dampak Besar</Text>
            </View>

            {/* LOADING INDICATOR */}
            <View style={styles.loadingContainer}>
                <View style={styles.progressBarTrack}>
                    <Animated.View style={[styles.progressBarFill, progressStyle]} />
                </View>
                <Text style={styles.loadingText}>Memuat Ekosistem v2.0...</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#1A1A2E", // brand-dark
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999, // Ensure it covers everything
    },
    glowPurple: {
        position: "absolute",
        top: "-20%",
        left: "-20%",
        width: "140%",
        height: "140%",
        borderRadius: 9999,
        // React Native doesn't have CSS blur natively on Views easily without blur view,
        // Using opacity and radial gradient mock
    },
    glowLime: {
        position: "absolute",
        bottom: "-10%",
        right: "-10%",
        width: 256,
        height: 256,
        backgroundColor: "#CCFF00",
        opacity: 0.05,
        borderRadius: 128,
    },
    logoContainer: {
        width: 160,
        height: 160,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },
    planet: {
        position: "absolute",
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: "center",
        justifyContent: "center",
        elevation: 10,
        shadowColor: "rgba(106, 13, 173, 0.6)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        zIndex: 10,
    },
    planetBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    continent: {
        position: "absolute",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 999,
        // Approximate blur
        opacity: 0.8,
    },
    orbitRing: {
        position: "absolute",
        borderRadius: 9999,
        justifyContent: "center",
        alignItems: "center",
    },
    orbitLime: {
        width: 160,
        height: 160,
        borderWidth: 3,
        borderColor: "rgba(204, 255, 0, 0.8)", // brand-lime
        zIndex: 20,
    },
    orbitFaint: {
        width: 128,
        height: 128,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        zIndex: 0,
    },
    orbitParticle: {
        position: "absolute",
        top: -1.5,
        width: 12,
        height: 12,
        backgroundColor: "white",
        borderRadius: 6,
        elevation: 5,
        shadowColor: "white",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    textContainer: {
        alignItems: "center",
        zIndex: 10,
        gap: 8,
    },
    title: {
        fontFamily: "PublicSans-Bold",
        fontSize: 36,
        color: "white",
        letterSpacing: -0.5,
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontFamily: "PublicSans-Medium",
        color: "#D8B4E2", // text-purple-200 mock
        fontSize: 14,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        opacity: 0.8,
    },
    loadingContainer: {
        position: "absolute",
        bottom: 48,
        width: 192, // w-48
        alignItems: "center",
    },
    progressBarTrack: {
        width: "100%",
        height: 4,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 999,
        overflow: "hidden",
        marginBottom: 12,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#CCFF00",
        elevation: 5,
        shadowColor: "#CCFF00",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    loadingText: {
        fontSize: 10,
        fontFamily: "PublicSans-Regular",
        color: "#6B7280", // text-gray-500
    },
});
