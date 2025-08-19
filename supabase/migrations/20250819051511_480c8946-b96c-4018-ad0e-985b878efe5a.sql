-- Fix all critical security issues

-- 1. Create missing setup_first_user_workspace function
CREATE OR REPLACE FUNCTION public.setup_first_user_workspace(p_name text DEFAULT 'Meu Workspace'::text)
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

  -- Check if user already has a workspace
  SELECT EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.user_id = uid
  ) INTO already_has_workspace;
  
  IF already_has_workspace THEN
    RAISE EXCEPTION 'User already has a workspace';
  END IF;

  -- Create workspace
  INSERT INTO public.workspaces (name)
  VALUES (p_name)
  RETURNING id INTO ws_id;
  
  -- Add user as owner
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (uid, ws_id, 'owner');

  RETURN ws_id;
END;
$$;

-- 2. Update invitation token handling to use hashed tokens
ALTER TABLE public.invitations 
DROP COLUMN IF EXISTS token,
ADD COLUMN IF NOT EXISTS token_hash text;

-- Create secure invitation creation function
CREATE OR REPLACE FUNCTION public.create_invitation(_workspace_id uuid, _email text, _role user_role DEFAULT 'member'::user_role)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token text := gen_random_uuid()::text;
BEGIN
  -- Only admins/owners of workspace can create invitations
  IF NOT has_workspace_role(_workspace_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Sem permissão para convidar usuários';
  END IF;

  INSERT INTO public.invitations (email, workspace_id, invited_by, role, token_hash)
  VALUES (lower(_email), _workspace_id, auth.uid(), _role, encode(digest(token, 'sha256'),'hex'));

  RETURN token; -- Return token to caller, don't store plain value
END;
$$;

-- Accept invitation function with token hash verification
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
  uid uuid := auth.uid();
  now_ts timestamptz := now();
  p_hash text := encode(digest(p_token, 'sha256'),'hex');
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.invitations
  WHERE status = 'pending'
    AND expires_at > now_ts
    AND (
      token_hash = p_hash
      OR (token_hash IS NULL AND token = p_token) -- Backward compatibility
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  -- Ensure user email matches invitation
  PERFORM 1 FROM auth.users u WHERE u.id = uid AND lower(u.email) = lower(inv.email);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email do usuário não corresponde ao convite';
  END IF;

  -- Create membership if needed
  IF NOT EXISTS (
    SELECT 1 FROM public.members m WHERE m.user_id = uid AND m.workspace_id = inv.workspace_id
  ) THEN
    INSERT INTO public.members (user_id, workspace_id, role)
    VALUES (uid, inv.workspace_id, inv.role);
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now_ts
  WHERE id = inv.id;

  RETURN inv.workspace_id;
END;
$$;

-- 3. Create secure WABA credentials functions that don't expose secrets to frontend
CREATE OR REPLACE FUNCTION public.update_waba_credentials(
  p_waba_id uuid,
  p_name text,
  p_meta_business_id text,
  p_waba_id_text text,
  p_verify_token text DEFAULT NULL,
  p_app_secret text DEFAULT NULL,
  p_access_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ws_id uuid;
BEGIN
  -- Get workspace_id and verify permissions
  SELECT workspace_id INTO ws_id FROM public.wabas WHERE id = p_waba_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WABA not found';
  END IF;
  
  IF NOT has_workspace_role(ws_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE public.wabas
  SET 
    name = p_name,
    meta_business_id = p_meta_business_id,
    waba_id = p_waba_id_text,
    verify_token = p_verify_token,
    app_secret = p_app_secret,
    access_token = p_access_token
  WHERE id = p_waba_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_waba_secure(
  p_workspace_id uuid,
  p_name text,
  p_meta_business_id text,
  p_waba_id text,
  p_verify_token text DEFAULT NULL,
  p_app_secret text DEFAULT NULL,
  p_access_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_workspace_role(p_workspace_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  INSERT INTO public.wabas (
    workspace_id, name, meta_business_id, waba_id, 
    verify_token, app_secret, access_token
  )
  VALUES (
    p_workspace_id, p_name, p_meta_business_id, p_waba_id,
    p_verify_token, p_app_secret, p_access_token
  );

  RETURN true;
END;
$$;

-- 4. Ensure all sensitive tables have proper RLS enabled

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wabas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_list_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies - only admins can view audit logs
CREATE POLICY "audit_logs_select_admins" ON public.audit_logs
FOR SELECT TO authenticated
USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

-- 6. Create function to log critical operations
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_workspace_id uuid,
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    workspace_id, user_id, action, table_name, record_id,
    old_values, new_values, created_at
  )
  VALUES (
    p_workspace_id, auth.uid(), p_action, p_table_name, p_record_id,
    p_old_values, p_new_values, now()
  );
END;
$$;