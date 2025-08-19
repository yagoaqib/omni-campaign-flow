BEGIN;

-- Create avatars storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to get user profile safely
CREATE OR REPLACE FUNCTION public.get_user_profile(p_workspace_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  avatar_url text,
  workspace_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    up.id,
    up.name,
    up.email,
    up.phone,
    up.avatar_url,
    up.workspace_id
  FROM public.user_profiles up
  WHERE up.workspace_id = p_workspace_id
    AND public.is_member(up.workspace_id)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid) TO authenticated;

-- Function to update user profile safely
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_workspace_id uuid,
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate workspace membership
  IF NOT public.is_member(p_workspace_id) THEN
    RAISE EXCEPTION 'Access denied: Not a member of this workspace';
  END IF;

  -- Update profile
  UPDATE public.user_profiles 
  SET 
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE workspace_id = p_workspace_id;

  -- Insert if not exists
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (
      workspace_id, name, email, phone, avatar_url
    ) VALUES (
      p_workspace_id, 
      COALESCE(p_name, 'Usuário'),
      p_email,
      p_phone,
      p_avatar_url
    );
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_profile(uuid, text, text, text, text) TO authenticated;

COMMIT;