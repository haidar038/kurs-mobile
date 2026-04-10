# KURS — Product Requirements Document (mobile)

## 1. Executive summary
KURS (Kurir Sampah) is a mobile-first service that connects households with local waste-collection personnel. It mirrors ride-hailing UX (request → accept → pickup → confirm) but for household waste. Core differentiators: scheduled/instant pickup requests, photo-based waste classification, integrated Waste Bank deposit workflow using QR-based account linking, and an educational/articles module.  
Tech stack: **React Native (Expo + TypeScript)**, **Supabase** (Auth, Postgres, Storage, Realtime, Edge Functions), **TailwindCSS** (NativeWind / tailwind-react-native-classnames).

---

## 2. Objectives & success metrics
**Objectives**
- Make household waste pickup simple, trackable, and monetizable for collectors.
- Encourage correct waste sorting via photo classification and articles.
- Provide Waste Banks a traceable deposit flow with QR-based depositor linking.

**Success metrics (examples)**
- Conversion: % of app installs → first pickup request.
- Fulfillment rate: % of pickup requests successfully completed.
- Average time from request → pickup start.
- User retention: 7-day / 30-day retention.
- Waste Bank deposits recorded per month.
- Classification accuracy (if automated): top-1 accuracy of model on labeled test set.

---

## 3. Target users & personas
1. **Household depositor** — general public, wants convenient pickup or to deposit at waste bank. Needs simple UX, location auto-fill, photo upload.  
2. **Collector (Kurir)** — operator of waste transport fleet; needs job queue, navigation, earnings dashboard.  
3. **Waste Bank staff** — needs QR scan deposit flow, deposit verification, deposit history.  
4. **Facility / Waste Bank Admin** — manage facility profiles and staff.  
5. **Operator** — regional operator (manage collectors, areas, analytics).  
6. **Admin / Superadmin** — global platform management and audit.  
7. **Support** — customer support role for handling disputes and tickets.

---

## 4. Scope & product tiers
**MVP (minimum viable)**
- Pickup request (instant/manual schedule), photo uploads, location auto-detect, basic waste type selection, Rp10k minimum charge (configurable).
- Collector assignment & job acceptance (realtime).
- Waste Bank QR deposit flow (scan → link account → deposit form → verification).
- Basic user profile & deposit/pickup history.
- Map with TPS / Waste Bank points (static + dynamic entries).
- Articles module (CMS-driven).
- Image storage (Supabase Storage), basic classification (server-side call to 3rd-party or placeholder rule-based).

**v1+ (post-MVP)**
- Automated image-based waste classification (improve accuracy).
- In-app payments and receipts (integration with local gateway).
- Ratings & complaints.
- Scheduled recurring pickups.
- Advanced analytics & reporting for Waste Banks and operators.
- Offline-first pickup reporting.

---

## 5. Role-Based Access Control (RBAC)

### 5.1 Why RBAC is included
RBAC defines who can read, create, update, and delete each resource. It is essential for:
- Enforcing least privilege and protecting PII and financial data.
- Mapping UI visibility and backend RLS (Row Level Security) policies.
- Enabling audits, compliance checks, and security testing.

### 5.2 Roles (canonical list)
- **guest** — unauthenticated / public visitor: view public content (articles, map).  
- **user** (depositor) — create pickups, view own history, generate/see deposit QR.  
- **collector** — accept and update assigned pickups, view own earnings.  
- **waste_bank_staff** — scan depositor QR, create/verify deposits for assigned facility.  
- **facility_admin** (waste_bank_admin) — manage facility metadata and staff; view facility analytics and deposits.  
- **operator** — regional operations manager: manage collectors in region, view regional analytics.  
- **support** — customer support agent: view tickets, limited read access to pickup/deposit records for dispute handling.  
- **admin** — global superuser: manage users, roles, pricing, disputes, system settings, and full read/write access.

### 5.3 Permission Matrix (resource × action)
Legend: R = Read, C = Create, U = Update, D = Delete, (own) = limited to own records, (assigned) = only when assigned.

| Resource / Action | guest | user | collector | waste_bank_staff | facility_admin | operator | support | admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Articles (CRUD) | R | R | R | R | R | R | R | CUD |
| View Map / Facilities | R | R | R | R | R | R | R | R |
| Create Pickup | ✗ | C (own) | ✗ | ✗ | ✗ | ✗ | ✗ | C |
| Read Pickup | ✗ | R (own) | R (assigned) | ✗ | R (region) | R (region) | R (ticket-related) | R |
| Update Pickup Status | ✗ | ✗ | U (assigned) | ✗ | U (region) | U (region) | ✗ | U |
| Cancel Pickup | ✗ | U (own) | ✗ | ✗ | ✗ | ✗ | ✗ | U |
| Create Deposit (Waste Bank) | ✗ | C (generate QR only) | ✗ | C (assigned facility) | C (facility) | ✗ | ✗ | C |
| Verify Deposit | ✗ | ✗ | ✗ | U (assigned facility) | U (facility) | ✗ | ✗ | U |
| Read Deposit History | ✗ | R (own deposits) | ✗ | R (facility) | R (facility) | R (region) | R (ticket-related) | R |
| Manage Facilities | ✗ | ✗ | ✗ | ✗ | CUD | ✓ (region) | ✗ | CUD |
| Manage Collectors | ✗ | ✗ | ✗ | ✗ | ✗ | CUD (region) | ✗ | CUD |
| View Earnings / Payouts | ✗ | R (own) | R (own) | R (facility summary) | R (facility) | R (region) | ✗ | R |
| Request Payout | ✗ | ✗ | C (own) | ✗ | ✗ | ✗ | ✗ | C |
| Manage Users / Roles | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | CUD |
| Payments / Transactions | ✗ | R (own) | ✗ | ✗ | R (facility) | R (region) | ✗ | RUD |
| Notifications | R | R | R | R | R | R | R | R |
| Audit / Export Data | ✗ | ✗ | ✗ | ✗ | ✗ | R (region) | ✗ | RUD |

Notes:
- "region" indicates scoping by assigned operational region. Implement region scoping with RLS filters.
- Support role has limited read-only access needed to resolve tickets; avoid exposing full financial details unless required and audited.

### 5.4 RBAC Implementation Guidance (Supabase)
- Include role in JWT claims (`jwt.claims.role`) at sign-in or via Edge Function to prevent client-side role tampering.
- Use Postgres enum for roles (recommended) and RLS policies per table. See migration command example below (outside PRD).
- For region/facility scoping, include `region_id` or `facility_id` columns and include them in RLS policies.
- Prefer minimal privilege in client; enforce sensitive checks server-side (Edge Functions) when logic is complex.

Example RLS policy patterns:

```sql
-- Allow users to read only their pickups
CREATE POLICY "select_own_pickups" ON pickup_requests
FOR SELECT USING (user_id = auth.uid());

-- Allow assigned collector to update status
CREATE POLICY "collector_update_assigned" ON pickup_requests
FOR UPDATE USING (assigned_collector_id = auth.uid());

-- Allow facility admins to manage facilities they own
CREATE POLICY "facility_admin_manage" ON facilities
FOR ALL USING (current_setting('jwt.claims.role', true) = 'facility_admin' AND facility_admins @> auth.uid()::text[]);
```

### 5.5 Testing RBAC
- Create test cases to verify horizontal and vertical privilege boundaries:
  - User A cannot read User B's pickups.
  - Collector cannot update pickups not assigned to them.
  - Waste Bank staff can only verify deposits for their facility.
  - Support can view pickup photos for ticket-related records but cannot modify them.
- Include these test cases in QA matrix and automate with integration tests where possible.

---

## 6. Core features — functional specification
(see original PRD sections for Pickup Requests, Collector App, Waste Bank QR flow, Classification, Map & Facilities, Articles, Payments, Notifications, Admin dashboard)

[...same content as original PRD for features; for brevity in this file the full feature sections are preserved but not repeated here. In the delivered engineering handoff, include all functional specs from the original PRD intact.]

---

## 7. Data model (key tables)
- `users` (id UUID PK, name, phone, email, role user_role ENUM, profile_photo, created_at)  
- `collectors` (user_id FK, vehicle_info, status, location_lat, location_lng, rating_avg)  
- `pickup_requests` (id, user_id, location_geo POINT, address, photos JSONB, waste_type, volume, scheduled_at, status ENUM, assigned_collector_id, fee, created_at)  
- `facilities` (id, name, type ENUM(TPS,WasteBank), location_geo, address, contact, opening_hours, facility_admins JSONB)  
- `deposits` (id, depositor_id FK, waste_bank_id FK, photos JSONB, weight, waste_type, status ENUM, verified_by_id, created_at)  
- `payments` (id, user_id, amount, gateway_txn_id, method, status, related_pickup_id)  
- `articles` (id, title, body_markdown, tags, published_at)  
- `classifications` (id, image_url, predicted_label, confidence, model_version, created_at)  
- `notifications` (id, user_id, type, payload JSONB, read_at)

Implementation notes:
- Use a Postgres enum `user_role` for role values to enforce valid roles at DB level.
- Use geography/point for spatial queries.
- Store staff associations (facility_admins) as arrays or link tables based on access patterns.

---

## 8. Supabase implementation details
(See original PRD Supabase section)
- Auth: Supabase Auth (email/phone OTP) with custom JWT claims for roles.
- Database: Postgres with RLS using `current_setting('jwt.claims.role', true)`.
- Storage: Supabase Storage; signed URLs.
- Realtime/Edge Functions: broadcasting, classification, QR token validation, payment webhooks.

---

## 9. Frontend architecture (Expo + TypeScript)
(See original PRD Frontend architecture section)

---

## 10. Security, privacy & compliance
(See original PRD Security section — include RBAC acceptance criteria like enforcement verified by tests)

---

## 11. Acceptance criteria (project-level)
- RBAC rules implemented and verified with test cases.
- All core flows (pickup lifecycle, deposit QR flow) respect RBAC boundaries.
- Role enum exists in DB and is used for RLS checks.

---

## 12. Deliverables to hand off to engineering
- PRD (this file) with RBAC section and permission matrix.  
- Postgres schema SQL (DDL) including `user_role` enum and `users.role` column typed to the enum.  
- RLS policy drafts for key tables.  
- Supabase project skeleton and Edge Function placeholders.  
- Expo project scaffold and component checklist.  
- QA test matrix with RBAC test cases.

---

## Appendix A — RBAC Migration & Agent Command (outside PRD)
Below are explicit commands and SQL content you should run/create when you want to migrate the `users.role` column to an enum type. These steps are **outside** the PRD but required for engineering.

1. Create a new Supabase migration (manual step):

```bash
# create migration file (edit the SQL after it's created)
bunx supabase migration new add_user_role_enum
```

2. Edit the generated migration SQL file and insert SQL similar to:

```sql
BEGIN;

-- create enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'guest',
      'user',
      'collector',
      'waste_bank_staff',
      'facility_admin',
      'operator',
      'support',
      'admin'
    );
  END IF;
END$$;

-- ensure users.role is text prior to cast
ALTER TABLE users ALTER COLUMN role TYPE text USING role::text;

-- change column to the new enum
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;

-- set default (if desired)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

COMMIT;
```

3. Push migration (manual step after editing the migration file):

```bash
# after reviewing and saving migration SQL
bunx supabase db push
```

4. Update application code to use enum values (string literals) and ensure JWT claim generation uses same enum values.

5. Update RLS policies to reference `current_setting('jwt.claims.role', true)` and compare with enum strings.

---

## Appendix B — Notes about uploaded files
Some previously uploaded project files have expired on the server and are not available in this session. If you want me to combine or reference those specific files (for example an initial SQL schema or prior PRD), please re-upload them and I will incorporate them into the deliverable.

---
