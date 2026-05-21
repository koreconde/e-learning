
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads (assigned_to);

INSERT INTO public.admin_allowlist (email) VALUES
  ('serena@escapecampus.it'),
  ('manar@escapecampus.it'),
  ('antonella@escapecampus.it'),
  ('cristina@escapecampus.it')
ON CONFLICT DO NOTHING;
