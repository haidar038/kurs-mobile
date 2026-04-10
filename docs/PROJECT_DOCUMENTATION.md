# KURS (Jaga Bumi) - Master Documentation

> **Last Updated:** 2026-02-19
> **Status:** Active Development (Phase: Feature Implementation)
> **Version:** 1.0.0

---

## 1. Product Requirements Document (PRD)

### 1.1 Project Overview

**KURS (Jaga Bumi)** adalah platform manajemen sampah terintegrasi yang menghubungkan Masyarakat (User), Kolektor Sampah (Driver), dan Bank Sampah (TPS/Fasilitas).

**Visi:** Menciptakan ekosistem daur ulang yang efisien, transparan, dan menguntungkan bagi semua pihak melalui teknologi.
**Misi:** Mengubah stigma sampah dari "masalah" menjadi "aset" bernilai ekonomi.

### 1.2 Core Users & Roles

1.  **Masyarakat (User)**:
    - Request pickup sampah (On-demand).
    - Lihat lokasi TPS terdekat.
    - Scan sampah menggunakan AI untuk identifikasi jenis & nilai.
    - Mendapatkan Poin/Saldo dari sampah yang disetor.
    - Edukasi melalui artikel/panduan.
2.  **Kolektor (Driver)**:
    - Menerima order pickup.
    - Navigasi ke lokasi user.
    - Update status pickup (Menjemput, Mengangkut, Selesai).
    - Melihat estimasi penghasilan.
3.  **Staff Bank Sampah (Facility)**:
    - Verifikasi timbangan sampah masuk.
    - Manajemen inventaris TPS.

### 1.3 Key Features

- **Authentication**: Email/Password, Role-based Access Control (RBAC).
- **Pickup System**: Real-time status tracking, Maps integration.
- **AI Waste Lens**: Google Gemini AI untuk deteksi jenis sampah dari foto.
- **Gamification**: Misi harian, Poin, Leveling user (e.g., "Warga Level 1").
- **Wallet & Points**: Konversi sampah ke Rupiah/Poin.
- **Education**: Feed artikel/tips daur ulang.
- **Chat System**: Komunikasi in-app (User-Driver, User-CS).

---

## 2. Technical Context

### 2.1 Tech Stack

- **Framework**: React Native (Expo SDK 52)
- **Router**: Expo Router (File-based routing)
- **Language**: TypeScript
- **Styling**: NativeWind (TailwindCSS)
- **Database & Auth**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (`@google/genai`)
- **Maps**: `react-native-maps` / `react-native-gifted-charts`

### 2.2 Project Structure

- `app/`: Expo Router pages.
    - `(app)`: User flow (Tabs: Home, Scan, History, Profile).
    - `(collector)`: Driver flow.
    - `(waste-bank)`: Staff flow.
    - `(auth)`: Login/Register.
- `src/`:
    - `services/`: API integration (AI, Supabase, Xendit).
    - `stores/`: State management (Zustand).
    - `components/`: Reusable UI components.
    - `hooks/`: Custom React hooks.

---

## 3. Development Status (As of Feb 19, 2026)

**Overall Progress: ~60% Completed**

### ✅ Completed (Ready)

| Feature             | Status  | Notes                                               |
| :------------------ | :------ | :-------------------------------------------------- |
| **Auth & RBAC**     | 🟢 Done | Login, Register, Role Switching works.              |
| **Home Dashboard**  | 🟢 Done | Stats, Location, Article Feed implemented.          |
| **Pickup Request**  | 🟢 Done | Request form, Map selection, active state tracking. |
| **AI Waste Lens**   | 🟢 Done | Camera UI + Gemini Analysis integration.            |
| **Facilities Map**  | 🟢 Done | Map view of nearby TPS.                             |
| **Profile**         | 🟢 Done | Edit profile, settings.                             |
| **Database Schema** | 🟢 Done | All tables (chat, missions, wallet) created.        |

### ⚠️ Implementation Pending (UI/Logic Needed)

These features have database support but lack frontend implementation:

1.  **Wallet System**:
    - [ ] Transaction History UI.
    - [ ] Withdraw/Topup UI.
2.  **Missions (Gamification)**:
    - [ ] Missions List Screen.
    - [ ] "Claim Reward" Logic.
3.  **Chat System**:
    - [ ] Chat Room UI (`react-native-gifted-chat`).
    - [ ] Real-time subscription.
4.  **Reviews**:
    - [ ] Rating Modal after pickup.

---

## 4. Roadmap & Milestones

### 🏁 Milestone 1: The "Engagement" Update (Priority)

Fokus: Meningkatkan retensi user dan melengkapi "loop" aplikasi.

- [x] **Install Dependencies**: `date-fns`, `lottie-react-native`, `expo-blur`.
- [ ] **Wallet UI**: Implementasi layar "Dompet" & "Riwayat Poin".
- [ ] **Missions UI**: Layar daftar misi harian & visualisasi progress.
- [ ] **Notification System**: Menghubungkan lonceng notifikasi dengan tabel database.

### 🏁 Milestone 2: Social & Trust

Fokus: Membangun kepercayaan antar pengguna.

- [ ] **Chat System**: Implementasi fitur chat User-Kolektor.
- [ ] **Review System**: Modal rating untuk driver setelah pickup selesai.
- [ ] **Help Center**: Halaman FAQ statis/dinamis.

### 🏁 Milestone 3: Polish & Release

Fokus: Persiapan rilis produksi.

- [ ] **Onboarding Screen**: Intro slide untuk user baru.
- [ ] **Performance Optimization**: Lazy loading images, query caching.
- [ ] **Deep Linking**: Handle notification clicks.
- [ ] **Midtrans/Xendit Integration**: Real payment gateway integration.
- [ ] **Final Testing**: End-to-end testing semua flow.

---

## 5. Notes & Recommendations

- **Critical**: Because of limited "Build Quota", **ALL** potential native dependencies (maps, payments, measuring tools) must be installed in the next build to avoid blocking future development.
- **Design**: Maintain the "Premium/Clean" look. Use `lottie` for moments of delight (e.g., successful scan, level up).
- **Data**: Ensure `carbon_saved` calculation adheres to the formula in `carbon-emission-formula.md`.
