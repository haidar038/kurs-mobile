-- Migration: Allow collectors to claim requested jobs
-- Run with: bunx supabase db push

BEGIN;

CREATE POLICY "Collectors can claim requested jobs" ON public.pickup_requests
  FOR UPDATE
  USING (
    status = 'requested' AND
    EXISTS (SELECT 1 FROM public.collectors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    status = 'assigned' AND
    collector_id IN (SELECT id FROM public.collectors WHERE user_id = auth.uid())
  );

COMMIT;
