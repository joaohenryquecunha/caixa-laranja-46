-- Add fields to support admin dashboard requirements
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.user_activity
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
