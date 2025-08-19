-- Update setup_first_user_workspace to accept workspace name as parameter
CREATE OR REPLACE FUNCTION public.setup_first_user_workspace(p_name text DEFAULT 'Meu Workspace')
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

  -- Check if user already has a workspace
  SELECT EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.user_id = user_id
  ) INTO already_has_workspace;
  
  IF already_has_workspace THEN
    RAISE EXCEPTION 'User already has a workspace';
  END IF;

  -- Create the workspace with provided name
  INSERT INTO public.workspaces (name)
  VALUES (p_name)
  RETURNING id INTO workspace_id;
  
  -- Create membership for the user as owner
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (user_id, workspace_id, 'owner');

  RETURN workspace_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.setup_first_user_workspace(text) TO authenticated;