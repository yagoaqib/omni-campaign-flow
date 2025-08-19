-- Ensure strict RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Replace existing policies with strict workspace-based rules
DROP POLICY IF EXISTS con_sel ON public.contacts;
DROP POLICY IF EXISTS con_ins ON public.contacts;
DROP POLICY IF EXISTS con_upd ON public.contacts;
DROP POLICY IF EXISTS con_del ON public.contacts;

CREATE POLICY con_sel
ON public.contacts
FOR SELECT
USING (is_member(workspace_id));

CREATE POLICY con_ins
ON public.contacts
FOR INSERT
WITH CHECK (is_member(workspace_id));

CREATE POLICY con_upd
ON public.contacts
FOR UPDATE
USING (is_member(workspace_id))
WITH CHECK (is_member(workspace_id));

CREATE POLICY con_del
ON public.contacts
FOR DELETE
USING (is_member(workspace_id));
