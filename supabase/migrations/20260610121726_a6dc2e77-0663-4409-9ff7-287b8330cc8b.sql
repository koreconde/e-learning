ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contact_preference text;

CREATE INDEX IF NOT EXISTS idx_leads_contact_preference ON public.leads (contact_preference);