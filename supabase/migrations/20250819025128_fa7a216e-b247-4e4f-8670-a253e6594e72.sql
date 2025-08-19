-- Create user roles and invitation system

-- 1) Create user roles enum
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'member');

-- 2) Create user_roles table to track roles per workspace
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- 3) Create invitations table
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone
);

-- 4) Enable RLS on new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies for user_roles
CREATE POLICY "user_roles_select_members"
ON public.user_roles
FOR SELECT
USING (is_member(workspace_id));

CREATE POLICY "user_roles_insert_admins"
ON public.user_roles
FOR INSERT
WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "user_roles_update_admins"
ON public.user_roles
FOR UPDATE
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']))
WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "user_roles_delete_admins"
ON public.user_roles
FOR DELETE
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']));

-- 6) RLS policies for invitations
CREATE POLICY "invitations_select_members"
ON public.invitations
FOR SELECT
USING (is_member(workspace_id));

CREATE POLICY "invitations_insert_admins"
ON public.invitations
FOR INSERT
WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "invitations_update_admins"
ON public.invitations
FOR UPDATE
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']))
WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner','admin']));

CREATE POLICY "invitations_delete_admins"
ON public.invitations
FOR DELETE
USING (has_workspace_role(workspace_id, ARRAY['owner','admin']));

-- 7) Update triggers for timestamps
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8) Function to check if registration is allowed (only if no users exist yet)
CREATE OR REPLACE FUNCTION public.is_registration_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1);
$$;

-- 9) Function to create first workspace and set owner role
CREATE OR REPLACE FUNCTION public.setup_first_user(user_id uuid, workspace_name text DEFAULT 'Meu Workspace')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
BEGIN
  -- Create first workspace
  INSERT INTO public.workspaces (name)
  VALUES (workspace_name)
  RETURNING id INTO workspace_id;
  
  -- Add user as member
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (user_id, workspace_id, 'owner');
  
  -- Add user role
  INSERT INTO public.user_roles (user_id, workspace_id, role)
  VALUES (user_id, workspace_id, 'owner');
  
  RETURN workspace_id;
END;
$$;