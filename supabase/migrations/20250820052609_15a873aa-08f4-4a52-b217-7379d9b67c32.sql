-- Atualizar função get_contacts_masked para maior segurança
-- Garantir que apenas owner/admin vejam telefones/emails completos
CREATE OR REPLACE FUNCTION public.get_contacts_masked(_workspace_id uuid)
 RETURNS TABLE(
   id uuid,
   workspace_id uuid,
   phone text,
   name text,
   email text,
   source text,
   has_whatsapp boolean,
   last_contact timestamp with time zone,
   created_at timestamp with time zone,
   updated_at timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.workspace_id,
    CASE
      WHEN has_workspace_role(c.workspace_id, ARRAY['owner','admin']) THEN c.phone
      ELSE CASE
        WHEN c.phone IS NOT NULL AND length(c.phone) >= 4
          THEN repeat('*', GREATEST(length(c.phone) - 4, 0)) || right(c.phone, 4)
        ELSE '****'
      END
    END AS phone,
    c.name,
    CASE
      WHEN has_workspace_role(c.workspace_id, ARRAY['owner','admin']) THEN c.email
      ELSE CASE
        WHEN c.email IS NOT NULL AND position('@' in c.email) > 1
          THEN left(c.email, 1) || repeat('*', GREATEST(position('@' in c.email) - 2, 1)) || substring(c.email from position('@' in c.email))
        ELSE NULL
      END
    END AS email,
    c.source,
    c.has_whatsapp,
    c.last_contact,
    c.created_at,
    c.updated_at
  FROM public.contacts c
  WHERE c.workspace_id = _workspace_id
    AND is_member(c.workspace_id);
$function$;