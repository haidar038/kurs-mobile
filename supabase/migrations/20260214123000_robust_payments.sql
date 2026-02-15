-- Migration: Add QR persistence and enable Realtime
-- Run with: npx supabase db push

BEGIN;

-- 1. Add QR persistence columns to payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS qr_string text,
ADD COLUMN IF NOT EXISTS qr_id text;

-- 2. Enable Realtime for the payments table
-- This allows the frontend to receive instant updates when status changes
ALTER publication supabase_realtime ADD TABLE public.payments;

COMMIT;
