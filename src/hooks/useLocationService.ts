import { useAppStore } from "@/stores/useAppStore";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export function useLocationService() {
    const { currentLocation, setCurrentLocation } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locationName, setLocationName] = useState<string>("Memuat lokasi...");

    const isFetching = useRef(false);

    // Sync local state with global store
    useEffect(() => {
        if (currentLocation?.address) {
            const parts = currentLocation.address.split(", ");
            if (parts.length >= 2) {
                setLocationName(`${parts[0]}, ${parts[1]}`);
            } else {
                setLocationName(currentLocation.address);
            }
        }
    }, [currentLocation]);

    const processLocation = useCallback(
        async (loc: Location.LocationObject) => {
            try {
                const [address] = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });

                if (address) {
                    const formattedParts = [
                        address.street,
                        address.district,
                        address.subregion,
                        address.city,
                        address.region,
                    ].filter(Boolean);

                    const formattedAddress =
                        formattedParts.length > 0
                            ? formattedParts.join(", ")
                            : "Lokasi ditemukan";

                    setCurrentLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        address: formattedAddress,
                    });
                }
            } catch (geoError) {
                console.log("Geocoding failed:", geoError);
                setCurrentLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    address: `Koordinat: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
                });
            }
        },
        [setCurrentLocation]
    );

    const fetchLocation = useCallback(
        async (force = false) => {
            const currentLoc = useAppStore.getState().currentLocation;

            if (currentLoc && !force) return;
            if (isFetching.current) return;

            isFetching.current = true;
            setIsLoading(true);
            setError(null);

            if (!currentLoc) {
                setLocationName("Memuat lokasi...");
            }

            try {
                // 1. Check Services
                const enabled = await Location.hasServicesEnabledAsync();
                if (!enabled) {
                    setError("Layanan lokasi nonaktif");
                    setLocationName("Layanan lokasi nonaktif");
                    return;
                }

                // 2. Check Permissions
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    setError("Izin lokasi ditolak");
                    setLocationName("Izin lokasi ditolak");
                    return;
                }

                // 3. FAST PATH: Last Known Location
                const lastKnown = await Location.getLastKnownPositionAsync({});
                if (lastKnown) {
                    await processLocation(lastKnown);
                    if (!force) return; // Fast enough, no need for fresh fetch
                }

                // 4. ACCURATE PATH: Fresh fetch using expo-location's native timeout
                //    — avoids Promise.race which leaves dangling promises that can
                //      drop the Metro WebSocket connection on the same network interface.
                try {
                    const fresh = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                        // expo-location handles the timeout internally; no manual race needed.
                        mayShowUserSettingsDialog: false,
                    });
                    await processLocation(fresh);
                } catch (fetchError) {
                    console.log("Fresh location fetch failed:", fetchError);
                    // If we have no location at all, fall back gracefully
                    if (!currentLoc && !lastKnown) {
                        setLocationName("Ternate, ID");
                    }
                }
            } catch (err: any) {
                console.error("Location Service Error:", err);
                setError(err.message || "Gagal mengambil lokasi");
                if (!useAppStore.getState().currentLocation) {
                    setLocationName("Gagal memuat");
                }
            } finally {
                isFetching.current = false;
                setIsLoading(false);
            }
        },
        [processLocation]
    );

    return {
        locationName,
        isLoading,
        error,
        fetchLocation,
        currentLocation,
    };
}
