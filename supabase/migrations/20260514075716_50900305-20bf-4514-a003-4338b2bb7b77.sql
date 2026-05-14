CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT true,
  completed BOOLEAN NOT NULL DEFAULT false,
  level TEXT,
  score INTEGER,
  total INTEGER,
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public form: anyone can insert a lead
CREATE POLICY "Anyone can insert a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Public form: anyone can update a lead by id (used to attach test results to the row just created)
CREATE POLICY "Anyone can update leads"
  ON public.leads FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- No public SELECT or DELETE — only service role (backend / admins) can read/delete.
CREATE POLICY "Service role can read leads"
  ON public.leads FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete leads"
  ON public.leads FOR DELETE
  USING (auth.role() = 'service_role');