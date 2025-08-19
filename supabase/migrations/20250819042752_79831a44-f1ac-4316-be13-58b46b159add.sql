-- Fix ambiguous user_id reference in setup_first_user_workspace function
CREATE OR REPLACE FUNCTION public.setup_first_user_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_id uuid;
  user_id uuid := auth.uid();
  already_has_workspace boolean;
BEGIN
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user already has a workspace (with explicit table alias)
  SELECT EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.user_id = user_id
  ) INTO already_has_workspace;
  
  IF already_has_workspace THEN
    RAISE EXCEPTION 'User already has a workspace';
  END IF;

  -- Create the first workspace
  INSERT INTO public.workspaces (name)
  VALUES ('Meu Workspace')
  RETURNING id INTO workspace_id;
  
  -- Create membership for the user as owner (use explicit variable)
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (user_id, workspace_id, 'owner');

  RETURN workspace_id;
END;
$$;