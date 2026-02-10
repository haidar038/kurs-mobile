-- ============================================
-- KURS RBAC Migration
-- Copy this content into your actual migration file
-- ============================================

BEGIN;

-- 1. Create user_role enum type
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

-- 2. Add region_id column to profiles for operator scoping
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS region_id uuid,
  ADD COLUMN IF NOT EXISTS facility_id uuid REFERENCES public.facilities(id);

-- 3. Convert role column from text to enum
-- First, drop the existing check constraint and default
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Update any unknown roles to 'user' before conversion
UPDATE public.profiles SET role = 'user' WHERE role IS NULL OR role NOT IN (
  'guest', 'user', 'collector', 'waste_bank_staff', 'facility_admin', 'operator', 'support', 'admin'
);

-- Convert column to enum
ALTER TABLE public.profiles 
  ALTER COLUMN role TYPE user_role USING role::user_role;

-- Set new default
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- 4. Update trigger function to use enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user'::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Drop existing RLS policies
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Collectors  
DROP POLICY IF EXISTS "Collectors are viewable by authenticated" ON public.collectors;
DROP POLICY IF EXISTS "Collectors can update own record" ON public.collectors;

-- Facilities
DROP POLICY IF EXISTS "Facilities are public" ON public.facilities;

-- Pickup requests
DROP POLICY IF EXISTS "Users can read own pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "Users can insert own pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "Users and collectors can update pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "Collectors can view available pickups" ON public.pickup_requests;

-- Deposits
DROP POLICY IF EXISTS "Users can read own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Staff can insert deposits" ON public.deposits;

-- Articles
DROP POLICY IF EXISTS "Published articles are public" ON public.articles;

-- Bookmarks
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;

-- ============================================
-- 6. Create RBAC-aware RLS policies
-- ============================================

-- Helper function to get current user's role (in public schema)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'guest'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.get_user_role() = 'admin'::user_role;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== PROFILES ==========
-- Users can read own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Users can update own profile (except role)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Users can insert own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========== PICKUP REQUESTS ==========
-- Users can read own pickups
CREATE POLICY "pickups_select_own" ON public.pickup_requests
  FOR SELECT USING (user_id = auth.uid());

-- Collectors can read assigned pickups
CREATE POLICY "pickups_select_collector" ON public.pickup_requests
  FOR SELECT USING (
    public.get_user_role() = 'collector'::user_role AND
    collector_id IN (SELECT id FROM public.collectors WHERE user_id = auth.uid())
  );

-- Collectors can view available (requested) pickups
CREATE POLICY "pickups_select_available" ON public.pickup_requests
  FOR SELECT USING (
    public.get_user_role() = 'collector'::user_role AND
    status = 'requested'
  );

-- Admin/Operator can read all pickups
CREATE POLICY "pickups_select_admin" ON public.pickup_requests
  FOR SELECT USING (public.get_user_role() IN ('admin'::user_role, 'operator'::user_role));

-- Users can create own pickups
CREATE POLICY "pickups_insert_own" ON public.pickup_requests
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'user'::user_role AND
    user_id = auth.uid()
  );

-- Admin can create pickups
CREATE POLICY "pickups_insert_admin" ON public.pickup_requests
  FOR INSERT WITH CHECK (public.is_admin());

-- Collectors can update assigned pickups (status)
CREATE POLICY "pickups_update_collector" ON public.pickup_requests
  FOR UPDATE USING (
    public.get_user_role() = 'collector'::user_role AND
    collector_id IN (SELECT id FROM public.collectors WHERE user_id = auth.uid())
  );

-- Users can cancel own pickups
CREATE POLICY "pickups_update_own_cancel" ON public.pickup_requests
  FOR UPDATE USING (
    public.get_user_role() = 'user'::user_role AND
    user_id = auth.uid()
  );

-- Admin/Operator can update any pickup
CREATE POLICY "pickups_update_admin" ON public.pickup_requests
  FOR UPDATE USING (public.get_user_role() IN ('admin'::user_role, 'operator'::user_role));

-- ========== DEPOSITS ==========
-- Users can read own deposits
CREATE POLICY "deposits_select_own" ON public.deposits
  FOR SELECT USING (depositor_id = auth.uid());

-- Waste bank staff can read facility deposits
CREATE POLICY "deposits_select_staff" ON public.deposits
  FOR SELECT USING (
    public.get_user_role() = 'waste_bank_staff'::user_role AND
    waste_bank_id IN (
      SELECT facility_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Facility admin can read facility deposits
CREATE POLICY "deposits_select_facility_admin" ON public.deposits
  FOR SELECT USING (
    public.get_user_role() = 'facility_admin'::user_role AND
    waste_bank_id IN (
      SELECT facility_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admin can read all deposits
CREATE POLICY "deposits_select_admin" ON public.deposits
  FOR SELECT USING (public.is_admin());

-- Waste bank staff can create deposits for their facility
CREATE POLICY "deposits_insert_staff" ON public.deposits
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'waste_bank_staff'::user_role AND
    waste_bank_id IN (
      SELECT facility_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Facility admin can create deposits
CREATE POLICY "deposits_insert_facility_admin" ON public.deposits
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'facility_admin'::user_role AND
    waste_bank_id IN (
      SELECT facility_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admin can create deposits
CREATE POLICY "deposits_insert_admin" ON public.deposits
  FOR INSERT WITH CHECK (public.is_admin());

-- Staff/FacilityAdmin can verify (update) deposits
CREATE POLICY "deposits_update_staff" ON public.deposits
  FOR UPDATE USING (
    public.get_user_role() IN ('waste_bank_staff'::user_role, 'facility_admin'::user_role) AND
    waste_bank_id IN (
      SELECT facility_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admin can update any deposit
CREATE POLICY "deposits_update_admin" ON public.deposits
  FOR UPDATE USING (public.is_admin());

-- ========== FACILITIES ==========
-- Public can read facilities
CREATE POLICY "facilities_select_public" ON public.facilities
  FOR SELECT USING (true);

-- Facility admin can manage own facility
CREATE POLICY "facilities_all_facility_admin" ON public.facilities
  FOR ALL USING (
    public.get_user_role() = 'facility_admin'::user_role AND
    id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
  );

-- Operator/Admin can manage all facilities
CREATE POLICY "facilities_all_admin" ON public.facilities
  FOR ALL USING (public.get_user_role() IN ('operator'::user_role, 'admin'::user_role));

-- ========== COLLECTORS ==========
-- Authenticated can view collectors
CREATE POLICY "collectors_select_auth" ON public.collectors
  FOR SELECT TO authenticated USING (true);

-- Collectors can update own record
CREATE POLICY "collectors_update_own" ON public.collectors
  FOR UPDATE USING (user_id = auth.uid());

-- Operator/Admin can manage collectors
CREATE POLICY "collectors_all_admin" ON public.collectors
  FOR ALL USING (public.get_user_role() IN ('operator'::user_role, 'admin'::user_role));

-- ========== ARTICLES ==========
-- Public can read published articles
CREATE POLICY "articles_select_public" ON public.articles
  FOR SELECT USING (published = true);

-- Admin can manage all articles
CREATE POLICY "articles_all_admin" ON public.articles
  FOR ALL USING (public.is_admin());

-- ========== BOOKMARKS ==========
-- Users can manage own bookmarks
CREATE POLICY "bookmarks_all_own" ON public.bookmarks
  FOR ALL USING (user_id = auth.uid());

-- ========== PAYMENTS ==========
-- Users can read own payments
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    pickup_request_id IN (
      SELECT id FROM public.pickup_requests WHERE user_id = auth.uid()
    )
  );

-- Admin can manage all payments
CREATE POLICY "payments_all_admin" ON public.payments
  FOR ALL USING (public.is_admin());

COMMIT;
