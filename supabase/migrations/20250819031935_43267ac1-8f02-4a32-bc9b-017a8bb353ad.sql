-- Restrict sensitive credential columns exposure in wabas
-- Revoke select on sensitive columns from client-facing roles
REVOKE SELECT (access_token, app_secret, verify_token) ON public.wabas FROM authenticated, anon;

-- Ensure service_role can access these columns for server-side usage (edge functions)
GRANT SELECT (access_token, app_secret, verify_token) ON public.wabas TO service_role;