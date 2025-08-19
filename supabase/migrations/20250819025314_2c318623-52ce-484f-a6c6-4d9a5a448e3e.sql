-- Invitations workflow functions and safe first-user setup

-- 1) Replace setup_first_user with safety guard
CREATE OR REPLACE FUNCTION public.setup_first_user(user_id uuid, workspace_name text DEFAULT 'Meu Workspace')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
  already_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.members LIMIT 1) INTO already_exists;
  IF already_exists THEN
    RETURN NULL; -- do nothing if there are already members
  END IF;

  INSERT INTO public.workspaces (name)
  VALUES (workspace_name)
  RETURNING id INTO workspace_id;
  
  INSERT INTO public.members (user_id, workspace_id, role)
  VALUES (user_id, workspace_id, 'owner');

  RETURN workspace_id;
END;
$$;

-- 2) Accept invitation securely
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  uid uuid := auth.uid();
  now_ts timestamptz := now();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now_ts
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  -- Ensure the logged user email matches the invitation email
  PERFORM 1 FROM auth.users u WHERE u.id = uid AND lower(u.email) = lower(inv.email);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email do usuário não corresponde ao convite';
  END IF;

  -- Create membership if missing
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

-- 3) Create invitation server-side (returns token)
CREATE OR REPLACE FUNCTION public.create_invitation(_workspace_id uuid, _email text, _role public.user_role DEFAULT 'member')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text := gen_random_uuid()::text;
BEGIN
  -- Only admins/owners of the workspace can create invitations
  IF NOT has_workspace_role(_workspace_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Sem permissão para convidar usuários';
  END IF;

  INSERT INTO public.invitations (email, workspace_id, invited_by, role, token)
  VALUES (lower(_email), _workspace_id, auth.uid(), _role, token);

  RETURN token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation(uuid, text, public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_first_user(uuid, text) TO authenticated;