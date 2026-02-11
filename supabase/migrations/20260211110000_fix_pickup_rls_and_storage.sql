-- Migration: Fix Pickup RLS and Add Storage Policies (Retry with Unique Names)
-- Run with: bunx supabase db push

BEGIN;

-- 1. Fix RLS for pickup_requests
DROP POLICY IF EXISTS "pickups_insert_own" ON public.pickup_requests;

CREATE POLICY "pickups_insert_own" ON public.pickup_requests
  FOR INSERT WITH CHECK (
    -- Allow ANY authenticated user to create a pickup for themselves
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  );

-- 2. Ensure Storage Buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pickup-photos', 'pickup-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-photos', 'deposit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Add Storage Policies for 'pickup-photos' with UNIQUE names to avoid conflicts
-- SELECT (Public)
DROP POLICY IF EXISTS "pickup_photos_select_public" ON storage.objects;
CREATE POLICY "pickup_photos_select_public" ON storage.objects FOR SELECT
USING ( bucket_id = 'pickup-photos' );

-- INSERT (Authenticated)
DROP POLICY IF EXISTS "pickup_photos_insert_auth" ON storage.objects;
CREATE POLICY "pickup_photos_insert_auth" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'pickup-photos' AND auth.role() = 'authenticated' );

-- UPDATE (Owner)
DROP POLICY IF EXISTS "pickup_photos_update_own" ON storage.objects;
CREATE POLICY "pickup_photos_update_own" ON storage.objects FOR UPDATE
USING ( bucket_id = 'pickup-photos' AND owner = auth.uid() );

-- DELETE (Owner)
DROP POLICY IF EXISTS "pickup_photos_delete_own" ON storage.objects;
CREATE POLICY "pickup_photos_delete_own" ON storage.objects FOR DELETE
USING ( bucket_id = 'pickup-photos' AND owner = auth.uid() );

-- 4. Add Storage Policies for 'deposit-photos'
-- SELECT
DROP POLICY IF EXISTS "deposit_photos_select_public" ON storage.objects;
CREATE POLICY "deposit_photos_select_public" ON storage.objects FOR SELECT
USING ( bucket_id = 'deposit-photos' );

-- INSERT
DROP POLICY IF EXISTS "deposit_photos_insert_auth" ON storage.objects;
CREATE POLICY "deposit_photos_insert_auth" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'deposit-photos' AND auth.role() = 'authenticated' );

COMMIT;
