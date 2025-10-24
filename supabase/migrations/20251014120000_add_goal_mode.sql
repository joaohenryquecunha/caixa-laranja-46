ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'automatic';
