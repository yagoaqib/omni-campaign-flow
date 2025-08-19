-- Additional PII protection for contacts: remove direct SELECT and expose masked RPC

-- 1) Revoke direct SELECT on contacts from authenticated users
REVOKE SELECT ON public.contacts FROM authenticated;

-- 2) Create RPC that returns masked data for non-admins, full for admins
CREATE OR REPLACE FUNCTION public.get_contacts_masked(_workspace_id uuid)
RETURNS TABLE (
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
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.workspace_id,
    CASE
      WHEN has_workspace_role(c.workspace_id, ARRAY['owner','admin']) THEN c.phone
      ELSE CASE
        WHEN c.phone IS NOT NULL AND length(c.phone) >= 4
          THEN repeat('*', GREATEST(length(c.phone) - 4, 0)) || right(c.phone, 4)
        ELSE NULL
      END
    END AS phone,
    c.name,
    CASE
      WHEN has_workspace_role(c.workspace_id, ARRAY['owner','admin']) THEN c.email
      ELSE NULL
    END AS email,
    c.source,
    c.has_whatsapp,
    c.last_contact,
    c.created_at,
    c.updated_at
  FROM public.contacts c
  WHERE c.workspace_id = _workspace_id
    AND is_member(c.workspace_id);
$$;

-- 3) Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION public.get_contacts_masked(uuid) TO authenticated;