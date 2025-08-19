-- Harden RLS and block anonymous access on contacts

-- 1) Ensure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 2) Replace policies with strict workspace-based ones (idempotent drops)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_sel') THEN
    DROP POLICY "con_sel" ON public.contacts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_ins') THEN
    DROP POLICY "con_ins" ON public.contacts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_upd') THEN
    DROP POLICY "con_upd" ON public.contacts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_del') THEN
    DROP POLICY "con_del" ON public.contacts;
  END IF;
END $$;

CREATE POLICY "con_sel"
ON public.contacts
FOR SELECT
USING (is_member(workspace_id));

CREATE POLICY "con_ins"
ON public.contacts
FOR INSERT
WITH CHECK (is_member(workspace_id));

CREATE POLICY "con_upd"
ON public.contacts
FOR UPDATE
USING (is_member(workspace_id))
WITH CHECK (is_member(workspace_id));

CREATE POLICY "con_del"
ON public.contacts
FOR DELETE
USING (is_member(workspace_id));

-- 3) Explicitly block anonymous role from direct access
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.contacts FROM anon;
-- Keep authenticated role access governed by RLS (grant if missing)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;