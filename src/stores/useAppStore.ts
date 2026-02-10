import type { Facility, PickupRequest } from "@/types/database";
import { create } from "zustand";

interface Location {
    latitude: number;
    longitude: number;
    address?: string;
}

interface AppState {
    // User location
    currentLocation: Location | null;
    setCurrentLocation: (location: Location | null) => void;

    // Active pickup (for tracking)
    activePickup: PickupRequest | null;
    setActivePickup: (pickup: PickupRequest | null) => void;

    // Selected facility
    selectedFacility: Facility | null;
    setSelectedFacility: (facility: Facility | null) => void;

    // Pickup form draft
    pickupDraft: {
        photos: string[];
        wasteTypes: string[];
        address: string;
        notes: string;
        scheduledAt: Date | null;
    };
    updatePickupDraft: (draft: Partial<AppState["pickupDraft"]>) => void;
    resetPickupDraft: () => void;
}

const initialPickupDraft = {
    photos: [],
    wasteTypes: [],
    address: "",
    notes: "",
    scheduledAt: null,
};

export const useAppStore = create<AppState>((set) => ({
    // Location
    currentLocation: null,
    setCurrentLocation: (location) => set({ currentLocation: location }),

    // Active pickup
    activePickup: null,
    setActivePickup: (pickup) => set({ activePickup: pickup }),

    // Selected facility
    selectedFacility: null,
    setSelectedFacility: (facility) => set({ selectedFacility: facility }),

    // Pickup draft
    pickupDraft: initialPickupDraft,
    updatePickupDraft: (draft) =>
        set((state) => ({
            pickupDraft: { ...state.pickupDraft, ...draft },
        })),
    resetPickupDraft: () => set({ pickupDraft: initialPickupDraft }),
}));
