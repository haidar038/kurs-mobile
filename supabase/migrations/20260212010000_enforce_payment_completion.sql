-- Migration: Enforce payment completion before pickup completion
-- Run with: bunx supabase db push

BEGIN;

-- Function to check payment status
CREATE OR REPLACE FUNCTION public.check_payment_before_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run check if status is changing to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Check if there is a completed payment for this pickup
    IF NOT EXISTS (
      SELECT 1 FROM public.payments
      WHERE pickup_request_id = NEW.id
      AND status = 'completed'
    ) THEN
      RAISE EXCEPTION 'Cannot complete pickup without a completed payment.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS ensure_payment_on_complete ON public.pickup_requests;
CREATE TRIGGER ensure_payment_on_complete
  BEFORE UPDATE ON public.pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_payment_before_complete();

COMMIT;
