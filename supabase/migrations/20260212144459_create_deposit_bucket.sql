-- Migration: Create 'deposits' Storage Bucket
-- Run with: bunx supabase db push

BEGIN;

-- 1. Create 'deposits' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposits', 'deposits', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add Storage Policies for 'deposits'

-- SELECT (Public)
DROP POLICY IF EXISTS "deposits_select_public" ON storage.objects;
CREATE POLICY "deposits_select_public" ON storage.objects FOR SELECT
USING ( bucket_id = 'deposits' );

-- INSERT (Authenticated)
DROP POLICY IF EXISTS "deposits_insert_auth" ON storage.objects;
CREATE POLICY "deposits_insert_auth" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'deposits' AND auth.role() = 'authenticated' );

-- UPDATE (Owner)
DROP POLICY IF EXISTS "deposits_update_own" ON storage.objects;
CREATE POLICY "deposits_update_own" ON storage.objects FOR UPDATE
USING ( bucket_id = 'deposits' AND owner = auth.uid() );

-- DELETE (Owner)
DROP POLICY IF EXISTS "deposits_delete_own" ON storage.objects;
CREATE POLICY "deposits_delete_own" ON storage.objects FOR DELETE
USING ( bucket_id = 'deposits' AND owner = auth.uid() );

COMMIT;
