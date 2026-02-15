-- Migration: Add external_id to payments table
-- Run with: bunx supabase db push

BEGIN;

-- 1. Add external_id column
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS external_id text;

-- 2. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_id);

-- 3. Add unique constraint (optional but recommended to prevent duplicates)
ALTER TABLE public.payments 
ADD CONSTRAINT unique_external_id UNIQUE (external_id);

COMMIT;
