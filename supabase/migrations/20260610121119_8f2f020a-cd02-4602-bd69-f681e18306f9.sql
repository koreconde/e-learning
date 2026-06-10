ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS lead_quality text;

CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads (lead_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_lead_quality ON public.leads (lead_quality);