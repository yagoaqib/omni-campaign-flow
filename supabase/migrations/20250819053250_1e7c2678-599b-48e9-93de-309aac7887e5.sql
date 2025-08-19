BEGIN;

-- 1) Habilitar RLS (idempotente) em tabelas sensíveis
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_list_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wabas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cascade_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_stack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_template_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 2) Função helper segura para obter email do usuário atual
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(u.email) FROM auth.users u WHERE u.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;

-- 3) Políticas de convites: somente destinatários ou admins podem consultar
DROP POLICY IF EXISTS invitations_select_members ON public.invitations;
CREATE POLICY invitations_select_recipients_or_admins
ON public.invitations
FOR SELECT
USING (
  public.has_workspace_role(workspace_id, ARRAY['owner','admin'])
  OR lower(email) = public.current_user_email()
);

-- mantém as políticas de INSERT/UPDATE/DELETE existentes (apenas admins)

-- 4) View segura de WABAs sem segredos
CREATE OR REPLACE VIEW public.wabas_public AS
SELECT id, workspace_id, waba_id, name, meta_business_id, created_at
FROM public.wabas;

GRANT SELECT ON public.wabas_public TO authenticated;

-- 5) setup_first_user_workspace: garantir EXECUTE e adicionar wrapper sem parâmetros
GRANT EXECUTE ON FUNCTION public.setup_first_user_workspace(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.setup_first_user_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ws_id uuid;
BEGIN
  ws_id := public.setup_first_user_workspace('Meu Workspace');
  RETURN ws_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_first_user_workspace() TO authenticated;

-- 6) Endurecer funções de convite com search_path seguro e grants explícitos
CREATE OR REPLACE FUNCTION public.create_invitation(_workspace_id uuid, _email text, _role user_role DEFAULT 'member'::user_role)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  token text := gen_random_uuid()::text;
BEGIN
  IF NOT public.has_workspace_role(_workspace_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Sem permissão para convidar usuários';
  END IF;

  INSERT INTO public.invitations (email, workspace_id, invited_by, role, token_hash)
  VALUES (lower(_email), _workspace_id, auth.uid(), _role, encode(digest(token, 'sha256'),'hex'));

  RETURN token;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_invitation(uuid, text, user_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_invitation(uuid, text, user_role) FROM anon;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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

  -- Garante que o email do usuário corresponde ao convite
  PERFORM 1 FROM auth.users u WHERE u.id = uid AND lower(u.email) = lower(inv.email);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email do usuário não corresponde ao convite';
  END IF;

  -- Cria associação se necessário
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
$function$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM anon;

-- 7) dispatch_jobs: completar políticas para admins
DROP POLICY IF EXISTS dj_sel ON public.dispatch_jobs;
DROP POLICY IF EXISTS dispatch_jobs_select ON public.dispatch_jobs;
CREATE POLICY dj_sel
ON public.dispatch_jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = dispatch_jobs.campaign_id
      AND public.is_member(c.workspace_id)
  )
);

DROP POLICY IF EXISTS dj_ins_admins ON public.dispatch_jobs;
CREATE POLICY dj_ins_admins
ON public.dispatch_jobs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = dispatch_jobs.campaign_id
      AND public.has_workspace_role(c.workspace_id, ARRAY['owner','admin'])
  )
);

DROP POLICY IF EXISTS dj_upd_admins ON public.dispatch_jobs;
CREATE POLICY dj_upd_admins
ON public.dispatch_jobs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = dispatch_jobs.campaign_id
      AND public.has_workspace_role(c.workspace_id, ARRAY['owner','admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = dispatch_jobs.campaign_id
      AND public.has_workspace_role(c.workspace_id, ARRAY['owner','admin'])
  )
);

DROP POLICY IF EXISTS dj_del_admins ON public.dispatch_jobs;
CREATE POLICY dj_del_admins
ON public.dispatch_jobs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = dispatch_jobs.campaign_id
      AND public.has_workspace_role(c.workspace_id, ARRAY['owner','admin'])
  )
);

-- 8) Triggers de updated_at em tabelas relevantes
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_tags_updated_at ON public.contact_tags;
CREATE TRIGGER update_contact_tags_updated_at
BEFORE UPDATE ON public.contact_tags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_lists_updated_at ON public.contact_lists;
CREATE TRIGGER update_contact_lists_updated_at
BEFORE UPDATE ON public.contact_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cascade_policies_updated_at ON public.cascade_policies;
CREATE TRIGGER update_cascade_policies_updated_at
BEFORE UPDATE ON public.cascade_policies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_template_statuses_updated_at ON public.template_statuses;
CREATE TRIGGER update_template_statuses_updated_at
BEFORE UPDATE ON public.template_statuses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Log de eventos de dispatch_jobs em webhook_events
CREATE OR REPLACE FUNCTION public.log_dispatch_job_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  ws_id uuid;
  cmp_id uuid := COALESCE(NEW.campaign_id, OLD.campaign_id);
BEGIN
  SELECT c.workspace_id INTO ws_id FROM public.campaigns c WHERE c.id = cmp_id;
  IF ws_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.webhook_events (workspace_id, event_type, payload, related_dispatch_job_id)
    VALUES (ws_id, 'dispatch_job_inserted', to_jsonb(NEW), NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.webhook_events (workspace_id, event_type, payload, related_dispatch_job_id)
    VALUES (ws_id, 'dispatch_job_updated', jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)), NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS log_dispatch_jobs_ins ON public.dispatch_jobs;
CREATE TRIGGER log_dispatch_jobs_ins
AFTER INSERT ON public.dispatch_jobs
FOR EACH ROW EXECUTE FUNCTION public.log_dispatch_job_events();

DROP TRIGGER IF EXISTS log_dispatch_jobs_upd ON public.dispatch_jobs;
CREATE TRIGGER log_dispatch_jobs_upd
AFTER UPDATE ON public.dispatch_jobs
FOR EACH ROW EXECUTE FUNCTION public.log_dispatch_job_events();

COMMIT;