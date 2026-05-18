-- Remove duplicate leads, keeping the "best" row per email:
-- prefer completed leads, then most recent
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lower(email)
           ORDER BY completed DESC, completed_at DESC NULLS LAST, created_at DESC
         ) AS rn
  FROM public.leads
)
DELETE FROM public.leads l
USING ranked r
WHERE l.id = r.id AND r.rn > 1;

-- Enforce uniqueness on email (case-insensitive) to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique_idx
  ON public.leads (lower(email));