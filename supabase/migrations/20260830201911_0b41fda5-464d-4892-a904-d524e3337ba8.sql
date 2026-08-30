CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

GRANT ALL ON public.phone_verifications TO service_role;

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications (phone, created_at DESC);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;