-- Add DELETE policy for workspaces to allow anonymous users to delete workspaces
CREATE POLICY "workspaces_delete_allow_anon" 
ON public.workspaces 
FOR DELETE 
TO public
USING (true);