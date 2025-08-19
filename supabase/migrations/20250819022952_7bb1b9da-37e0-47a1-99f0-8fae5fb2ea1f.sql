-- Create secure, masked views for PII with role-aware unmasking

-- 1) View for contacts with masking
CREATE OR REPLACE VIEW public.contacts_secure AS
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
WHERE is_member(c.workspace_id);

-- 2) View for audience_items with masking
CREATE OR REPLACE VIEW public.audience_items_secure AS
SELECT
  ai.id,
  ai.audience_id,
  CASE
    WHEN has_workspace_role(a.workspace_id, ARRAY['owner','admin']) THEN ai.raw_msisdn
    ELSE CASE
      WHEN ai.raw_msisdn IS NOT NULL AND length(ai.raw_msisdn) >= 4
        THEN repeat('*', GREATEST(length(ai.raw_msisdn) - 4, 0)) || right(ai.raw_msisdn, 4)
      ELSE NULL
    END
  END AS raw_msisdn,
  CASE
    WHEN has_workspace_role(a.workspace_id, ARRAY['owner','admin']) THEN ai.e164
    ELSE CASE
      WHEN ai.e164 IS NOT NULL AND length(ai.e164) >= 4
        THEN repeat('*', GREATEST(length(ai.e164) - 4, 0)) || right(ai.e164, 4)
      ELSE NULL
    END
  END AS e164,
  CASE
    WHEN has_workspace_role(a.workspace_id, ARRAY['owner','admin']) THEN ai.wa_id
    ELSE NULL
  END AS wa_id,
  ai.validation_status,
  ai.opt_in
FROM public.audience_items ai
JOIN public.audiences a ON a.id = ai.audience_id
WHERE is_member(a.workspace_id);

-- Notes:
-- RLS continues to apply on underlying tables; views add defense-in-depth masking.
