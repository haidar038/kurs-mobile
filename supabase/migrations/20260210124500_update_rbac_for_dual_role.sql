-- Migration to support dual-role (Collector as User) and Partner Registration

BEGIN;

-- 1. Relax pickup_requests policies to allow any role to act as a user for their own data
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "pickups_insert_own" ON public.pickup_requests;
DROP POLICY IF EXISTS "pickups_update_own_cancel" ON public.pickup_requests;

-- Recreate with broader permissions (removing role = 'user' check, keeping user_id = auth.uid())
CREATE POLICY "pickups_insert_own" ON public.pickup_requests
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "pickups_update_own_cancel" ON public.pickup_requests
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- 2. Allow users to register as collectors (Insert their own collector record)
DROP POLICY IF EXISTS "collectors_insert_self" ON public.collectors;

CREATE POLICY "collectors_insert_self" ON public.collectors
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

COMMIT;
