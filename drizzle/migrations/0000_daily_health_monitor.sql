CREATE TABLE public.health_monitor_config (id boolean PRIMARY KEY DEFAULT true CHECK (id), token uuid NOT NULL DEFAULT gen_random_uuid(), ai_paused boolean NOT NULL DEFAULT false, pause_reason text);
GRANT ALL ON public.health_monitor_config TO service_role;
ALTER TABLE public.health_monitor_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_only ON public.health_monitor_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TABLE public.health_monitor_runs (day date PRIMARY KEY, lease_until timestamptz NOT NULL, completed_at timestamptz, checks jsonb NOT NULL DEFAULT '[]', alert_status text);
GRANT ALL ON public.health_monitor_runs TO service_role;
ALTER TABLE public.health_monitor_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_only ON public.health_monitor_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE FUNCTION public.claim_health_monitor(p_day date) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claimed date;
BEGIN
INSERT INTO health_monitor_runs(day,lease_until) VALUES(p_day,now()+interval '15 minutes') ON CONFLICT(day) DO UPDATE SET lease_until=now()+interval '15 minutes' WHERE health_monitor_runs.completed_at IS NULL AND health_monitor_runs.lease_until<now() RETURNING day INTO claimed;
RETURN claimed IS NOT NULL;
END; $$;
REVOKE ALL ON FUNCTION public.claim_health_monitor(date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_health_monitor(date) TO service_role;