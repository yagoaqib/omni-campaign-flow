-- Recriar view wabas_public com SECURITY INVOKER para garantir que RLS seja aplicado por usuário
DROP VIEW IF EXISTS public.wabas_public;

CREATE VIEW public.wabas_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  workspace_id,
  waba_id,
  name,
  meta_business_id,
  created_at
FROM public.wabas
WHERE is_member(workspace_id);