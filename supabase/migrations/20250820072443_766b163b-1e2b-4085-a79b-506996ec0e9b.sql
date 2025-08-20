-- Update update_waba_credentials to support partial updates (NULL means no change; empty string clears)
CREATE OR REPLACE FUNCTION public.update_waba_credentials(
  p_waba_id uuid,
  p_name text,
  p_meta_business_id text,
  p_waba_id_text text,
  p_verify_token text DEFAULT NULL,
  p_app_secret text DEFAULT NULL,
  p_access_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ws_id uuid;
BEGIN
  -- Get workspace_id and verify permissions
  SELECT workspace_id INTO ws_id FROM public.wabas WHERE id = p_waba_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WABA not found';
  END IF;
  IF NOT has_workspace_role(ws_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Perform partial update: NULL keeps existing value; empty string clears
  UPDATE public.wabas
  SET 
    name = COALESCE(p_name, name),
    meta_business_id = COALESCE(p_meta_business_id, meta_business_id),
    waba_id = COALESCE(p_waba_id_text, waba_id),
    verify_token = CASE WHEN p_verify_token IS NULL THEN verify_token ELSE p_verify_token END,
    app_secret = CASE WHEN p_app_secret IS NULL THEN app_secret ELSE p_app_secret END,
    access_token = CASE WHEN p_access_token IS NULL THEN access_token ELSE p_access_token END
  WHERE id = p_waba_id;

  RETURN true;
END;
$$;