import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import JagaBumiLogo from "../../assets/images/jgbm-logo-white.svg";

interface AnimatedSplashScreenProps {
    onAnimationFinish?: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onAnimationFinish }) => {
    const logoScale = useSharedValue(0.8);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const progressWidth = useSharedValue(0);
    const fadeOutValue = useSharedValue(1);

    useEffect(() => {
        // Hide native splash screen
        SplashScreen.hideAsync().catch(() => {});

        // Logo entrance animation
        logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });

        // Text entrance (delayed)
        textOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));

        // Progress bar
        progressWidth.value = withTiming(100, {
            duration: 2000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });

        // Fade out and finish
        const timer = setTimeout(() => {
            fadeOutValue.value = withTiming(
                0,
                { duration: 400, easing: Easing.ease },
                (finished) => {
                    if (finished && onAnimationFinish) {
                        runOnJS(onAnimationFinish)();
                    }
                }
            );
        }, 2500);

        return () => clearTimeout(timer);
    }, [fadeOutValue, logoOpacity, logoScale, onAnimationFinish, progressWidth, textOpacity]);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const containerOpacityStyle = useAnimatedStyle(() => ({
        opacity: fadeOutValue.value,
    }));

    return (
        <Animated.View style={[styles.container, containerOpacityStyle]}>
            <LinearGradient colors={["#6A0DAD", "#1A1A2E"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

            {/* Subtle background decoration */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <JagaBumiLogo width={120} height={120} />
            </Animated.View>

            {/* Text */}
            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                <Text style={styles.title}>Jaga Bumi</Text>
                <Text style={styles.subtitle}>Langkah Kecil, Dampak Besar</Text>
            </Animated.View>

            {/* Loading Progress */}
            <View style={styles.loadingContainer}>
                <View style={styles.progressBarTrack}>
                    <Animated.View style={[styles.progressBarFill, progressStyle]} />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
    },
    bgCircle1: {
        position: "absolute",
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "rgba(204, 255, 0, 0.05)",
    },
    bgCircle2: {
        position: "absolute",
        bottom: -150,
        left: -150,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    logoContainer: {
        marginBottom: 32,
    },
    textContainer: {
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontFamily: "PublicSans-Bold",
        fontSize: 32,
        color: "white",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: "PublicSans-Medium",
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        letterSpacing: 0.5,
    },
    loadingContainer: {
        position: "absolute",
        bottom: 80,
        width: 200,
        alignItems: "center",
    },
    progressBarTrack: {
        width: "100%",
        height: 3,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 999,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#CCFF00",
        borderRadius: 999,
    },
});
