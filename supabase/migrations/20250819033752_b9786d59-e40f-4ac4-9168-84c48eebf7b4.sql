-- Restrict user_profiles read access to workspace members only
-- 1) Drop the overly-permissive SELECT policy
DROP POLICY IF EXISTS "user_profiles_select_workspace_members" ON public.user_profiles;

-- 2) Create a strict SELECT policy limited to workspace members
CREATE POLICY "user_profiles_select_workspace_members"
ON public.user_profiles
FOR SELECT
USING (
  is_member(workspace_id)
);
