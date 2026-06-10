-- Block all client-side writes; only service_role (backend / trigger via SECURITY DEFINER) can modify roles
CREATE POLICY "Only service_role can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Only service_role can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service_role can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated, anon
  USING (false);