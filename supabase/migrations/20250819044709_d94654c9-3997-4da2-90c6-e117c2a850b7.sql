-- Fix ambiguous user_id and provide secure creation path
-- 1) Remove overloaded no-arg function to avoid confusion
DROP FUNCTION IF EXISTS public.setup_first_user_workspace();

-- 2) Recreate setup_first_user_workspace with parameter and disambiguated variable
CREATE OR REPLACE FUNCTION public.setup_first_user_workspace(p_name text DEFAULT 'Meu Workspace')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ws_id uuid;
  uid uuid := auth.uid();
  already_has_workspace boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.user_id = uid
  ) INTO already_has_workspace;
  
  IF already_has_workspace THEN
    RAISE EXCEPTION 'User already has a workspace';
  END IF;

  INSERT INTO public.workspaces (name)
  VALUES (p_name)
  RETURNING id INTO ws_id;
  
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (uid, ws_id, 'owner');

  RETURN ws_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_first_user_workspace(text) TO authenticated;

-- 3) New function to create additional workspaces and add membership atomically
CREATE OR REPLACE FUNCTION public.create_workspace_for_current_user(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ws_id uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  INSERT INTO public.workspaces (name)
  VALUES (p_name)
  RETURNING id INTO ws_id;

  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (uid, ws_id, 'owner');

  RETURN ws_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace_for_current_user(text) TO authenticated;