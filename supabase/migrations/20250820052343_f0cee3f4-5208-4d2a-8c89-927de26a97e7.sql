-- Secure wabas_public exposure - simplified version
DO $$
BEGIN
  -- Check if wabas_public is a TABLE and enable RLS
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'wabas_public'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.wabas_public ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist and recreate them
    DROP POLICY IF EXISTS wabas_public_sel ON public.wabas_public;
    DROP POLICY IF EXISTS wabas_public_ins ON public.wabas_public;
    DROP POLICY IF EXISTS wabas_public_upd ON public.wabas_public;
    DROP POLICY IF EXISTS wabas_public_del ON public.wabas_public;
    
    -- Create restrictive policies
    CREATE POLICY wabas_public_sel ON public.wabas_public
      FOR SELECT USING (is_member(workspace_id));
      
    CREATE POLICY wabas_public_ins ON public.wabas_public
      FOR INSERT WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));
      
    CREATE POLICY wabas_public_upd ON public.wabas_public
      FOR UPDATE 
      USING (has_workspace_role(workspace_id, ARRAY['owner','admin']))
      WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));
      
    CREATE POLICY wabas_public_del ON public.wabas_public
      FOR DELETE USING (has_workspace_role(workspace_id, ARRAY['owner','admin'])); 
  END IF;

  -- If wabas_public is a VIEW, try to set security_invoker (PostgreSQL 15+)
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'wabas_public'
  ) THEN
    BEGIN
      ALTER VIEW public.wabas_public SET (security_invoker = true);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if not supported
      NULL;
    END;
  END IF;
END $$;