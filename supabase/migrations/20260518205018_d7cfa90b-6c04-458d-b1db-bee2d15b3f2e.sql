DROP INDEX IF EXISTS public.leads_email_unique_idx;
ALTER TABLE public.leads ADD CONSTRAINT leads_email_key UNIQUE (email);