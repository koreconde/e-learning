ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS lead_token text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_lead_token
ON public.leads (lead_token)
WHERE lead_token IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert a lead" ON public.leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON public.leads;
DROP POLICY IF EXISTS "Service role can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Service role can update leads" ON public.leads;

CREATE POLICY "Service role can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can update leads"
ON public.leads
FOR UPDATE
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);