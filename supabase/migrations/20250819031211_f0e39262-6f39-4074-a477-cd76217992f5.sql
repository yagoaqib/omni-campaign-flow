-- Fix user_profiles RLS policies to allow users to manage their own profiles
-- First, drop existing policies
DROP POLICY IF EXISTS user_profiles_insert_members ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_members ON user_profiles;
DROP POLICY IF EXISTS user_profiles_select_members ON user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_members ON user_profiles;

-- Create new policies that allow users to manage profiles in workspaces they belong to
-- And also allow creating profiles when setting up initially

-- Allow users to view profiles in workspaces they are members of
CREATE POLICY user_profiles_select_workspace_members 
ON user_profiles FOR SELECT 
USING (
  is_member(workspace_id) OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IS NOT NULL
  )
);

-- Allow users to create profiles in workspaces they are members of
-- OR if they are authenticated and no profile exists yet (for initial setup)
CREATE POLICY user_profiles_insert_workspace_members 
ON user_profiles FOR INSERT 
WITH CHECK (
  is_member(workspace_id) OR 
  (
    auth.uid() IS NOT NULL AND 
    NOT EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.workspace_id = user_profiles.workspace_id
    )
  )
);

-- Allow users to update profiles in workspaces they are members of
CREATE POLICY user_profiles_update_workspace_members 
ON user_profiles FOR UPDATE 
USING (is_member(workspace_id))
WITH CHECK (is_member(workspace_id));

-- Allow users to delete profiles in workspaces they are members of  
CREATE POLICY user_profiles_delete_workspace_members 
ON user_profiles FOR DELETE 
USING (is_member(workspace_id));