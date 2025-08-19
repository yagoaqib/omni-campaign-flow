BEGIN;
-- Tighten wabas_public view to enforce workspace scoping via is_member
CREATE OR REPLACE VIEW public.wabas_public AS
SELECT id, workspace_id, waba_id, name, meta_business_id, created_at
FROM public.wabas
WHERE public.is_member(workspace_id);

-- Ensure only authenticated can read (rows filtered by view predicate)
GRANT SELECT ON public.wabas_public TO authenticated;
COMMIT;