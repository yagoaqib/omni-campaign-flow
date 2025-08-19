-- Temporarily allow anonymous users to create workspaces for testing
-- This is a temporary fix until authentication is properly implemented

-- Update the workspaces insert policy to allow anonymous users
DROP POLICY IF EXISTS "workspaces_insert_any_auth" ON public.workspaces;

CREATE POLICY "workspaces_insert_allow_anon" 
ON public.workspaces 
FOR INSERT 
TO public
WITH CHECK (true);

-- Also update select policy to allow anonymous users to see workspaces
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;

CREATE POLICY "workspaces_select_allow_anon" 
ON public.workspaces 
FOR SELECT 
TO public
USING (true);

-- Update update policy to allow anonymous users
DROP POLICY IF EXISTS "workspaces_update_member" ON public.workspaces;

CREATE POLICY "workspaces_update_allow_anon" 
ON public.workspaces 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);