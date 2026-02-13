-- Migration: Add RLS policies for payments table
-- Run with: bunx supabase db push

BEGIN;

-- 1. Enable RLS (just in case)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can insert payments for their own pickups
DROP POLICY IF EXISTS "Users can pay for own pickups" ON public.payments;
CREATE POLICY "Users can pay for own pickups" ON public.payments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.pickup_requests
      WHERE id = pickup_request_id
      AND user_id = auth.uid()
    )
  );

-- 3. Policy: Users can view payments for their own pickups
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pickup_requests
      WHERE id = pickup_request_id
      AND user_id = auth.uid()
    )
  );

-- 4. Policy: Collectors can view payments for assigned pickups
DROP POLICY IF EXISTS "Collectors can view assigned payments" ON public.payments;
CREATE POLICY "Collectors can view assigned payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pickup_requests
      WHERE id = pickup_request_id
      AND collector_id IN (
        SELECT id FROM public.collectors WHERE user_id = auth.uid()
      )
    )
  );

COMMIT;
