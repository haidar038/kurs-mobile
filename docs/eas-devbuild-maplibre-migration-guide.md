# Migration Guide: Expo Go → EAS Development Build (MapLibre + OSM)

## Goal

Migrate your React Native app from **Expo Go** to a proper **EAS
Development Build** environment, while switching maps to **MapLibre +
OpenStreetMap (OSM)**.

This plan is optimized for: - Push Notifications - Native Permissions -
Payment Gateway Deep Linking (Xendit) - Multi-role + RBAC -
Production-aligned testing

---

## Phase 0 --- Key Principle

### Do NOT wait until the end.

Development Build should become your daily environment now.

Expo Go is only for early prototyping.

---

## Phase 1 --- Pre-Migration Checklist (Do This First)

### 1. Fix App Identity (Must Be Stable)

In `app.json` or `app.config.js`:

```json
{
    "expo": {
        "name": "Jaga Bumi",
        "slug": "jaga-bumi",
        "android": {
            "package": "com.binaryverse.jagabumi"
        },
        "ios": {
            "bundleIdentifier": "com.binaryverse.jagabumi"
        }
    }
}
```

These values should NOT change later.

---

### 2. Permissions Setup (Native-Accurate)

Example:

```json
{
    "android": {
        "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "POST_NOTIFICATIONS"]
    }
}
```

---

### 3. Plugins You Already Use

If you use notifications, location, etc:

```json
{
    "plugins": ["expo-notifications", "expo-location"]
}
```

---

### 4. Deep Linking Scheme (For Xendit Redirect)

Add:

```json
{
    "scheme": "yourapp"
}
```

So callbacks can return into your app.

---

## Phase 2 --- Setup EAS Development Build

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

or with Bun:

```bash
bun add -g eas-cli
```

---

### 2. Login

```bash
eas login
```

---

### 3. Initialize EAS

```bash
eas build:configure
```

This creates:

- `eas.json`

---

### 4. Configure `eas.json`

```json
{
    "build": {
        "development": {
            "developmentClient": true,
            "distribution": "internal"
        },
        "preview": {
            "distribution": "internal"
        },
        "production": {
            "autoIncrement": true
        }
    }
}
```

---

### 5. Build Development Client (Once)

```bash
eas build --profile development -p android
```

Install the APK on your device.

---

### 6. Daily Development Workflow

```bash
npx expo start --dev-client
```

No rebuild required unless native config changes.

---

## Phase 3 --- Map Migration: Google Maps → MapLibre + OSM

## Why MapLibre?

- Open-source
- No Google billing
- Works with OSM tiles
- Custom styling possible

---

### 1. Install MapLibre

```bash
bun add @maplibre/maplibre-react-native
```

Then install required Expo config plugin:

```bash
bun add expo-build-properties
```

---

### 2. Add Plugin Config

In `app.json`:

```json
{
    "plugins": [
        [
            "expo-build-properties",
            {
                "android": {
                    "minSdkVersion": 23
                }
            }
        ]
    ]
}
```

---

### 3. Basic MapLibre Implementation

Create `MapScreen.tsx`:

```tsx
import MapLibreGL from "@maplibre/maplibre-react-native";

MapLibreGL.setAccessToken(null);

export default function MapScreen() {
    return (
        <MapLibreGL.MapView style={{ flex: 1 }}>
            <MapLibreGL.Camera zoomLevel={14} centerCoordinate={[127.4, 0.8]} />

            <MapLibreGL.RasterSource id="osm" tileUrlTemplates={["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]}>
                <MapLibreGL.RasterLayer id="osmLayer" />
            </MapLibreGL.RasterSource>
        </MapLibreGL.MapView>
    );
}
```

---

### 4. Rebuild Required After Adding MapLibre

Because MapLibre is native:

```bash
eas build --profile development -p android
```

---

## Phase 4 --- Validation & Hardening

### Test These Early

- Push notifications (real device)
- Location permission prompts
- Map rendering + navigation
- Xendit deep link return flow
- RBAC enforcement via Supabase RLS

---

## Phase 5 --- Release Workflow

### Preview Build

```bash
eas build --profile preview -p android
```

### Production Build

```bash
eas build --profile production -p android
```

### OTA Updates (JS-only)

```bash
eas update
```

---

## Final Recommendation

You are already building a serious app.

Your correct workflow now is:

1.  Switch to Development Build immediately
2.  Integrate MapLibre + OSM early
3.  Test push notif + payments in real environment
4.  UI polish comes AFTER stability

---

If you want, I can generate a full production-ready template repo
structure for: - Supabase + RBAC - MapLibre navigation - Push
notification pipeline - Xendit callback handler
