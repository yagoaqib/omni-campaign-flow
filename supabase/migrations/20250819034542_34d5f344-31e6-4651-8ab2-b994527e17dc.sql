-- 1) Fortalecer RLS de workspaces: remover políticas permissivas e restringir a membros
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Remover políticas overly-permissive
DROP POLICY IF EXISTS "workspaces_select_allow_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_allow_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_allow_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_allow_anon" ON public.workspaces;

-- Seleção apenas para membros
CREATE POLICY "workspaces_select_members"
ON public.workspaces
FOR SELECT
USING (is_member(id));

-- Atualização apenas por membros
CREATE POLICY "workspaces_update_members"
ON public.workspaces
FOR UPDATE
USING (is_member(id))
WITH CHECK (is_member(id));

-- Inserção: apenas usuários autenticados (mantém onboarding, evita anônimo)
CREATE POLICY "workspaces_insert_authenticated"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Mantém política de DELETE existente para owner/admin
-- (não recriamos aqui; já existe "workspaces_delete_owner_admin")


-- 2) Endurecer convites: hash do token e funções seguras
-- Adiciona coluna de hash se não existir e cria unique constraint
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS token_hash text;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invitations_token_hash_key'
  ) THEN
    ALTER TABLE public.invitations
      ADD CONSTRAINT invitations_token_hash_key UNIQUE (token_hash);
  END IF;
END $$;

-- Recria create_invitation para salvar apenas o hash e retornar o token em claro para o chamador
CREATE OR REPLACE FUNCTION public.create_invitation(
  _workspace_id uuid,
  _email text,
  _role user_role DEFAULT 'member'::user_role
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token text := gen_random_uuid()::text;
BEGIN
  -- Apenas admins/owners do workspace podem criar convites
  IF NOT has_workspace_role(_workspace_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Sem permissão para convidar usuários';
  END IF;

  INSERT INTO public.invitations (email, workspace_id, invited_by, role, token_hash)
  VALUES (lower(_email), _workspace_id, auth.uid(), _role, encode(digest(token, 'sha256'),'hex'));

  RETURN token; -- retorna o token ao chamador, não armazena o valor em claro
END;
$$;

-- Recria accept_invitation para validar por hash, com retrocompatibilidade
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
      OR (token_hash IS NULL AND token = p_token)
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  -- Garante que o email do usuário bate com o convite
  PERFORM 1 FROM auth.users u WHERE u.id = uid AND lower(u.email) = lower(inv.email);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email do usuário não corresponde ao convite';
  END IF;

  -- Cria membership se necessário
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


-- 3) Fixar search_path explícito em funções críticas
-- get_waba_credentials com search_path seguro
CREATE OR REPLACE FUNCTION public.get_waba_credentials(
  p_workspace_id uuid,
  p_waba_id text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  waba_id text,
  name text,
  access_token text,
  app_secret text,
  verify_token text,
  meta_business_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Permite somente service_role (funções/serviços) ou owner/admin do workspace
  IF NOT (current_setting('role') = 'service_role' OR has_workspace_role(p_workspace_id, ARRAY['owner', 'admin'])) THEN
    RAISE EXCEPTION 'Access denied: Insufficient privileges to access credentials';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.waba_id,
    w.name,
    w.access_token,
    w.app_secret,
    w.verify_token,
    w.meta_business_id
  FROM public.wabas w
  WHERE w.workspace_id = p_workspace_id
    AND (p_waba_id IS NULL OR w.waba_id = p_waba_id);
END;
$$;

-- update_updated_at_column com search_path explícito (boa prática)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;