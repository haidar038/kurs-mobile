# KURS --- Product Requirements Document (mobile)

## 1. Executive summary

KURS (Kurir Sampah) is a mobile-first service that connects households
with local waste-collection personnel. It mirrors ride-hailing UX
(request → accept → pickup → confirm) but for household waste. Core
differentiators: scheduled/instant pickup requests, photo-based waste
classification, integrated Waste Bank deposit workflow using QR-based
account linking, and an educational/articles module.\
Tech stack: **React Native (Expo + TypeScript)**, **Supabase** (Auth,
Postgres, Storage, Realtime, Edge Functions), **TailwindCSS**
(NativeWind / tailwind-react-native-classnames).

------------------------------------------------------------------------

# 2. Objectives & success metrics

**Objectives** - Make household waste pickup simple, trackable, and
monetizable for collectors. - Encourage correct waste sorting via photo
classification and articles. - Provide Waste Banks a traceable deposit
flow with QR-based depositor linking.

**Success metrics (examples)** - Conversion: % of app installs → first
pickup request. - Fulfillment rate: % of pickup requests successfully
completed. - Average time from request → pickup start. - User retention:
7-day / 30-day retention. - Waste Bank deposits recorded per month. -
Classification accuracy (if automated): top-1 accuracy of model on
labeled test set.

------------------------------------------------------------------------

# 3. Target users & personas

1.  **Household depositor** --- general public, wants convenient pickup
    or to deposit at waste bank. Needs simple UX, location auto-fill,
    photo upload.
2.  **Collector (Kurir)** --- operator of waste transport fleet; needs
    job queue, navigation, earnings dashboard.
3.  **Waste Bank staff** --- needs QR scan deposit flow, deposit
    verification, deposit history.
4.  **Admin / Operator** --- manages pricing, drivers, complaints,
    facility registration, analytics.

------------------------------------------------------------------------

# 4. Scope & product tiers

**MVP (minimum viable)** - Pickup request (instant/manual schedule),
photo uploads, location auto-detect, basic waste type selection, Rp10k
minimum charge (configurable). - Collector assignment & job acceptance
(realtime). - Waste Bank QR deposit flow (scan → link account → deposit
form → verification). - Basic user profile & deposit/pickup history. -
Map with TPS / Waste Bank points (static + dynamic entries). - Articles
module (CMS-driven). - Image storage (Supabase Storage), basic
classification (server-side call to 3rd-party or placeholder
rule-based).

**v1+ (post-MVP)** - Automated image-based waste classification (improve
accuracy). - In-app payments and receipts (integration with local
gateway). - Ratings & complaints. - Scheduled recurring pickups. -
Advanced analytics & reporting for Waste Banks and operators. -
Offline-first pickup reporting.

------------------------------------------------------------------------

# 5. Core features --- functional specification

## 5.1 Pickup request (user)

-   **Inputs**: location (auto via permission + manual adjust), photos
    (1..N), waste type (select / suggested by classifier), optional
    volume estimate, preferred pickup time (ASAP or schedule), notes.
-   **Constraints**: minimum charge = Rp10,000 (configurable by admin).
    If user schedules, allow time window selection.
-   **Behaviour**:
    -   Create request in DB; store photos in Supabase Storage.
    -   Publish request via Supabase Realtime / push notifications to
        nearby collectors.
    -   Show live status: Requested → Assigned → En route → Completed →
        Paid.
-   **Acceptance criteria**:
    -   Requests created with valid geolocation and at least one photo.
    -   Real-time push to collectors within configurable radius.

## 5.2 Collector app (kurir)

-   **Views**: job queue, job details (photos, map + turn-by-turn),
    accept/decline, start pickup, complete pickup with optional
    collector photo and signature confirmation.
-   **Earnings**: per-job fee + daily totals, withdraw request
    integration (admin-managed).
-   **Acceptance criteria**:
    -   Collector can accept job and update statuses.
    -   Navigation link opens native maps with route.

## 5.3 Waste Bank QR deposit flow

-   **Deposit initiator (depositor)**: generates deposit QR (or shows
    account QR) in app; contains depositor account reference or deposit
    session token.
-   **Waste Bank staff**:
    -   Scan depositor QR → receives depositor reference → fills deposit
        form: type, photos, weight, notes.
    -   Staff confirms deposit; deposit stored with bidirectional link
        to depositor account.
-   **Database**: `deposits` table with `depositor_id`, `waste_bank_id`,
    `weight`, `photos[]`, `status`, `verified_by`.
-   **Acceptance criteria**:
    -   Scan flow reliably resolves depositor account.
    -   Depositor sees deposit in personal deposit history after
        verification.

## 5.4 Waste classification (photo)

-   **Feature**: user uploads photo(s); app suggests waste type(s) and
    estimated handling (pickup vs deposit).
-   **Implementation options**:
    -   MVP: send image to server-side classification endpoint (Edge
        Function) that returns suggestion (3 candidates).
    -   Long-term: on-device TF Lite model for faster inference.
-   **Acceptance criteria**:
    -   Suggestions shown with confidence score; user can override
        selection.

## 5.5 Map & facilities

-   **Map**: interactive map showing TPS and Waste Bank locations,
    ability to filter (TPS / Waste Bank / Pickup zones).
-   **Facility details**: address, opening hours, contact, deposit
    history (if permitted).
-   **Admin**: add/update facility entries.

## 5.6 Articles / Learning hub

-   CMS-backed articles in app; support categories and tag search; allow
    likes/bookmarks.

## 5.7 Payments & fees

-   **Payment model**: per-pickup fee, configurable by admin. Default
    minimum Rp10k.
-   **Flow**: collectors can be paid cash on pickup or via in-app
    payment routing (wallet); admin defines options.
-   **Integration**: gateway (Midtrans / Stripe / local PG) --- store
    transaction records in `payments` table.
-   **Acceptance criteria**:
    -   Transactions recorded; status consistent with pickup lifecycle.

## 5.8 Notifications & messaging

-   Push notifications: new job, accepted/declined, en route, arrival,
    verification, deposit confirmed.
-   In-app messages for job details and complaints.

## 5.9 Admin dashboard (web)

-   Manage users, collectors, Waste Banks, set prices, view analytics,
    handle disputes. (Can be Supabase Studio + custom admin UI.)

------------------------------------------------------------------------

# 6. User flows (high-level)

## 6.1 Instant pickup (user)

1.  Open app → tap "Request Pickup".
2.  Allow location → app autofills address; user adjusts if needed.
3.  Upload photos, choose waste type (or use classifier suggestion),
    optionally enter volume.
4.  Confirm request → charge minimum fee shown.
5.  System notifies nearby collectors → collector accepts.
6.  Collector en route → shows ETA → collector completes pickup with
    photo/signature.
7.  User and collector confirm; status = Completed → payment settled.

## 6.2 Waste Bank deposit (depositor → waste bank)

1.  Depositor opens "Deposit to Waste Bank" → generates or shows account
    QR.
2.  Waste Bank scans QR → opens deposit form → fills type, weight,
    photos.
3.  Waste Bank verifies deposit → depositor receives deposit record in
    history.

------------------------------------------------------------------------

# 7. Data model (key tables)

-   `users`
-   `collectors`
-   `pickup_requests`
-   `facilities`
-   `deposits`
-   `payments`
-   `articles`
-   `classifications`
-   `notifications`

------------------------------------------------------------------------

# 8. Supabase implementation details

-   Supabase Auth + role-based JWT claims.
-   Postgres with RLS policies.
-   Storage buckets for images with signed URLs.
-   Realtime updates for job lifecycle.
-   Edge Functions for classification, QR validation, payment webhooks.

------------------------------------------------------------------------

# 9. Frontend architecture (Expo + TypeScript)

-   Expo managed workflow, TypeScript.
-   Tailwind via NativeWind.
-   React Query + Zustand.
-   React Navigation.
-   React Native Maps.
-   Expo Camera/ImagePicker.

------------------------------------------------------------------------

# 10. Security, privacy & compliance

-   Collect minimal PII.
-   TLS + signed URLs.
-   Strict RLS.
-   Data export + deletion support.

------------------------------------------------------------------------

# 11. Testing & QA

-   Unit + integration tests.
-   End-to-end flow testing.
-   Load testing for pickup bursts.

------------------------------------------------------------------------

# 12. Analytics & monitoring

-   Core event tracking.
-   Sentry for crashes.
-   Alerts for webhook failures.

------------------------------------------------------------------------

# 13. UI / screens (minimum)

1.  Onboarding / auth\
2.  Home + map\
3.  Pickup request form\
4.  Live request tracker\
5.  Collector job queue\
6.  Waste Bank QR scan + deposit form\
7.  History\
8.  Articles\
9.  Profile + earnings\
10. Admin dashboard (web)

------------------------------------------------------------------------

# 14. Acceptance criteria (project-level)

-   Pickup lifecycle complete end-to-end.
-   Waste Bank deposits verified and linked.
-   Classification suggestions functional.
-   Payments and notifications consistent.
-   Security policies enforced.

------------------------------------------------------------------------

# 15. Deliverables

-   PRD (this file)
-   Postgres schema + RLS
-   Expo scaffold
-   Edge Function endpoints
-   QA test matrix
