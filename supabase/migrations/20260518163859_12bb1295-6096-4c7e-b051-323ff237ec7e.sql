CREATE TYPE public.call_outcome AS ENUM (
  'da_contattare',
  'contattato',
  'non_risponde',
  'richiamare',
  'interessato',
  'non_interessato',
  'iscritto'
);

ALTER TABLE public.leads
  ADD COLUMN call_status call_outcome NOT NULL DEFAULT 'da_contattare',
  ADD COLUMN call_notes TEXT,
  ADD COLUMN call_updated_at TIMESTAMPTZ,
  ADD COLUMN call_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "Admins can update leads outcome"
  ON public.leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
