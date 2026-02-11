import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, Text, View } from "react-native";

export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface MapPressEvent {
    nativeEvent: {
        coordinate: {
            latitude: number;
            longitude: number;
        };
        position: {
            x: number;
            y: number;
        };
    };
}

// Mock Marker component
export const Marker = (props: any) => null;

export const Callout = (props: any) => null;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = "default";

// Mock MapView component
const MapView = forwardRef((props: any, ref) => {
    useImperativeHandle(ref, () => ({
        animateToRegion: (region: Region, duration?: number) => {
            // No-op for web
        },
        fitToCoordinates: (coordinates: any[], options?: any) => {
            // No-op for web
        },
    }));

    return (
        <View style={[props.style, styles.container]}>
            <Text style={styles.text}>Maps not supported on web</Text>
        </View>
    );
});

MapView.displayName = "MapView";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    text: {
        color: "#888",
        fontSize: 14,
    },
});

export default MapView;
