-- Secure Contacts, Audiences and Audience Items with RLS and proper policies
-- 1) Enable RLS explicitly on all three tables
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audience_items ENABLE ROW LEVEL SECURITY;

-- 2) Ensure policies exist and are correct (idempotent)
DO $$
BEGIN
  -- Contacts policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_sel'
  ) THEN
    EXECUTE 'CREATE POLICY con_sel ON public.contacts FOR SELECT USING (is_member(workspace_id));';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_ins'
  ) THEN
    EXECUTE 'CREATE POLICY con_ins ON public.contacts FOR INSERT WITH CHECK (is_member(workspace_id));';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_upd'
  ) THEN
    EXECUTE 'CREATE POLICY con_upd ON public.contacts FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='con_del'
  ) THEN
    EXECUTE 'CREATE POLICY con_del ON public.contacts FOR DELETE USING (is_member(workspace_id));';
  END IF;

  -- Audiences policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audiences' AND policyname='aud_sel'
  ) THEN
    EXECUTE 'CREATE POLICY aud_sel ON public.audiences FOR SELECT USING (is_member(workspace_id));';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audiences' AND policyname='aud_ins'
  ) THEN
    EXECUTE 'CREATE POLICY aud_ins ON public.audiences FOR INSERT WITH CHECK (is_member(workspace_id));';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audiences' AND policyname='aud_upd'
  ) THEN
    EXECUTE 'CREATE POLICY aud_upd ON public.audiences FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audiences' AND policyname='aud_del'
  ) THEN
    EXECUTE 'CREATE POLICY aud_del ON public.audiences FOR DELETE USING (is_member(workspace_id));';
  END IF;

  -- Audience Items policies (scoped via parent audience -> workspace)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audience_items' AND policyname='ai_sel'
  ) THEN
    EXECUTE $$
      CREATE POLICY ai_sel ON public.audience_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.audiences a
          WHERE a.id = audience_items.audience_id
            AND is_member(a.workspace_id)
        )
      );
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audience_items' AND policyname='ai_ins'
  ) THEN
    EXECUTE $$
      CREATE POLICY ai_ins ON public.audience_items
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.audiences a
          WHERE a.id = audience_items.audience_id
            AND is_member(a.workspace_id)
        )
      );
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audience_items' AND policyname='ai_upd'
  ) THEN
    EXECUTE $$
      CREATE POLICY ai_upd ON public.audience_items
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.audiences a
          WHERE a.id = audience_items.audience_id
            AND is_member(a.workspace_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.audiences a
          WHERE a.id = audience_items.audience_id
            AND is_member(a.workspace_id)
        )
      );
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audience_items' AND policyname='ai_del'
  ) THEN
    EXECUTE $$
      CREATE POLICY ai_del ON public.audience_items
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.audiences a
          WHERE a.id = audience_items.audience_id
            AND is_member(a.workspace_id)
        )
      );
    $$;
  END IF;
END $$;
