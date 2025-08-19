-- Create secure credential retrieval function for edge functions
-- This function allows secure access to WABA credentials only for service_role operations
CREATE OR REPLACE FUNCTION public.get_waba_credentials(p_workspace_id uuid, p_waba_id text DEFAULT NULL)
RETURNS TABLE (
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
AS $$
BEGIN
  -- Only allow access if called from service_role context (edge functions)
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