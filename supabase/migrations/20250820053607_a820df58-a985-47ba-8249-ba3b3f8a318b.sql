-- 1) Replace RLS policies on public.wabas to restrict to authenticated members
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wabas' AND policyname = 'wabas_select_admins'
  ) THEN EXECUTE 'DROP POLICY "wabas_select_admins" ON public.wabas'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wabas' AND policyname = 'wabas_insert_admins'
  ) THEN EXECUTE 'DROP POLICY "wabas_insert_admins" ON public.wabas'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wabas' AND policyname = 'wabas_update_admins'
  ) THEN EXECUTE 'DROP POLICY "wabas_update_admins" ON public.wabas'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wabas' AND policyname = 'wabas_delete_admins'
  ) THEN EXECUTE 'DROP POLICY "wabas_delete_admins" ON public.wabas'; END IF;
END $$;

-- Create new member-scoped policies for authenticated users
CREATE POLICY wabas_select_members ON public.wabas
  FOR SELECT
  TO authenticated
  USING (is_member(workspace_id));

CREATE POLICY wabas_insert_members ON public.wabas
  FOR INSERT
  TO authenticated
  WITH CHECK (is_member(workspace_id));

CREATE POLICY wabas_update_members ON public.wabas
  FOR UPDATE
  TO authenticated
  USING (is_member(workspace_id))
  WITH CHECK (is_member(workspace_id));

CREATE POLICY wabas_delete_members ON public.wabas
  FOR DELETE
  TO authenticated
  USING (is_member(workspace_id));

-- 2) Public view without sensitive columns (no access_token/app_secret)
DROP VIEW IF EXISTS public.wabas_public;
CREATE VIEW public.wabas_public
WITH (security_invoker = true) AS
SELECT
  w.id,
  w.workspace_id,
  w.name,
  w.meta_business_id,
  w.waba_id,
  w.verify_token,
  w.created_at
FROM public.wabas w
WHERE is_member(w.workspace_id);

-- 3) Update get_waba_credentials to avoid leaking tokens to clients
CREATE OR REPLACE FUNCTION public.get_waba_credentials(
  p_workspace_id uuid,
  p_waba_id text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  waba_id text,
  name text,
  access_token text,
  app_secret text,
  verify_token text,
  meta_business_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow only service_role to receive tokens; owners/admins can see metadata only
  IF NOT (current_setting('role', true) = 'service_role' OR has_workspace_role(p_workspace_id, ARRAY['owner','admin'])) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.waba_id,
    w.name,
    CASE WHEN current_setting('role', true) = 'service_role' THEN w.access_token ELSE NULL END AS access_token,
    CASE WHEN current_setting('role', true) = 'service_role' THEN w.app_secret ELSE NULL END AS app_secret,
    w.verify_token,
    w.meta_business_id
  FROM public.wabas w
  WHERE w.workspace_id = p_workspace_id
    AND (p_waba_id IS NULL OR w.waba_id = p_waba_id);
END;
$$;