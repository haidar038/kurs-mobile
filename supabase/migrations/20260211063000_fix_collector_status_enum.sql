-- Fix collector status check constraint to allow admin approval statuses
-- Original constraint only allowed: ('available', 'busy', 'offline')
-- New constraint allows: ('available', 'busy', 'offline', 'approved', 'rejected', 'pending')

ALTER TABLE public.collectors DROP CONSTRAINT IF EXISTS collectors_status_check;

ALTER TABLE public.collectors
ADD CONSTRAINT collectors_status_check
CHECK (status IN ('available', 'busy', 'offline', 'approved', 'rejected', 'pending'));
