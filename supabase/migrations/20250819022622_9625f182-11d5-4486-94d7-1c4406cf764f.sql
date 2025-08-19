-- Secure user_profiles: remove public access and enforce workspace-based RLS

-- 1) Drop overly-permissive anon policies
DROP POLICY IF EXISTS user_profiles_select_allow_anon ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_allow_anon ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_allow_anon ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_allow_anon ON public.user_profiles;

-- 2) Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3) Add least-privilege policies using workspace membership
CREATE POLICY "user_profiles_select_members"
ON public.user_profiles
FOR SELECT
USING (is_member(workspace_id));

CREATE POLICY "user_profiles_insert_members"
ON public.user_profiles
FOR INSERT
WITH CHECK (is_member(workspace_id));

CREATE POLICY "user_profiles_update_members"
ON public.user_profiles
FOR UPDATE
USING (is_member(workspace_id))
WITH CHECK (is_member(workspace_id));

CREATE POLICY "user_profiles_delete_members"
ON public.user_profiles
FOR DELETE
USING (is_member(workspace_id));

-- 4) Keep updated_at accurate (idempotent trigger creation)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;