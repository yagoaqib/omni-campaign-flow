-- Secure wabas_public exposure
DO $$
BEGIN
  -- If wabas_public is a TABLE, enable RLS and add restrictive policies
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'wabas_public'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.wabas_public ENABLE ROW LEVEL SECURITY';

    -- SELECT only for workspace members
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'wabas_public' AND policyname = 'wabas_public_sel'
    ) THEN
      EXECUTE $$CREATE POLICY wabas_public_sel ON public.wabas_public
        FOR SELECT USING (is_member(workspace_id))$$;
    END IF;

    -- INSERT restricted to owner/admin
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'wabas_public' AND policyname = 'wabas_public_ins'
    ) THEN
      EXECUTE $$CREATE POLICY wabas_public_ins ON public.wabas_public
        FOR INSERT WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']))$$;
    END IF;

    -- UPDATE restricted to owner/admin
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'wabas_public' AND policyname = 'wabas_public_upd'
    ) THEN
      EXECUTE $$CREATE POLICY wabas_public_upd ON public.wabas_public
        FOR UPDATE USING (has_workspace_role(workspace_id, ARRAY['owner','admin']))
        WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']))$$;
    END IF;

    -- DELETE restricted to owner/admin
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'wabas_public' AND policyname = 'wabas_public_del'
    ) THEN
      EXECUTE $$CREATE POLICY wabas_public_del ON public.wabas_public
        FOR DELETE USING (has_workspace_role(workspace_id, ARRAY['owner','admin']))$$;
    END IF;
  END IF;

  -- If wabas_public is a VIEW, ensure it executes with SECURITY INVOKER semantics
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'wabas_public'
  ) THEN
    BEGIN
      -- Postgres 15+: set security_invoker so underlying table RLS is enforced for the caller
      EXECUTE 'ALTER VIEW public.wabas_public SET (security_invoker = true)';
    EXCEPTION WHEN others THEN
      -- Ignore if option unsupported in current PG version
      NULL;
    END;
  END IF;
END $$;