-- Secure helper functions for RLS
-- strictly typed and security definer to bypass RLS recursion

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
DECLARE
  _role public.user_role;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(_role, 'guest'::public.user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (public.get_user_role() = 'admin'::public.user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix RLS on collectors
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update collectors" ON public.collectors;

CREATE POLICY "Admins can update collectors"
ON public.collectors
FOR UPDATE
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix RLS on profiles (optional but good for completeness if admins need to update roles)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());
