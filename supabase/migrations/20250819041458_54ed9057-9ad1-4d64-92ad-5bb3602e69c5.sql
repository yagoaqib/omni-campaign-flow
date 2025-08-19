-- Fix workspace creation for first user setup
-- The current policies prevent first workspace creation due to circular dependency

-- First, let's check the current setup_first_user function and improve it
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

  -- Check if user already has a workspace
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
  
  -- Create membership for the user as owner
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (user_id, workspace_id, 'owner');

  RETURN workspace_id;
END;
$$;

-- Update workspace INSERT policy to allow first user creation
DROP POLICY IF EXISTS workspaces_insert_authenticated ON public.workspaces;

CREATE POLICY workspaces_insert_first_user
ON public.workspaces
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Allow if user has workspace membership (normal case)
    EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid())
    OR
    -- Allow if no members exist yet (first user case)
    NOT EXISTS (SELECT 1 FROM public.members LIMIT 1)
  )
);

-- Also ensure the members table has proper policies for first user
DROP POLICY IF EXISTS members_insert_self_or_admin ON public.members;

CREATE POLICY members_insert_self_or_admin
ON public.members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND (
    -- Normal case: admin of workspace inviting
    has_workspace_role(workspace_id, ARRAY['owner'::text, 'admin'::text])
    OR
    -- First user case: no members exist yet
    NOT EXISTS (SELECT 1 FROM public.members LIMIT 1)
  )
);