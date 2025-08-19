-- Tighten access to WhatsApp Business credentials (wabas)

-- 1) Drop existing permissive policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wabas' AND policyname='wabas_sel') THEN
    DROP POLICY "wabas_sel" ON public.wabas;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wabas' AND policyname='wabas_ins') THEN
    DROP POLICY "wabas_ins" ON public.wabas;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wabas' AND policyname='wabas_upd') THEN
    DROP POLICY "wabas_upd" ON public.wabas;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wabas' AND policyname='wabas_del') THEN
    DROP POLICY "wabas_del" ON public.wabas;
  END IF;
END $$;

-- 2) Enforce admin/owner-only access to sensitive credentials
ALTER TABLE public.wabas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wabas_select_admins"
ON public.wabas
FOR SELECT
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "wabas_insert_admins"
ON public.wabas
FOR INSERT
WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "wabas_update_admins"
ON public.wabas
FOR UPDATE
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']))
WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "wabas_delete_admins"
ON public.wabas
FOR DELETE
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']));

-- 3) Block anonymous access explicitly
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.wabas FROM anon;