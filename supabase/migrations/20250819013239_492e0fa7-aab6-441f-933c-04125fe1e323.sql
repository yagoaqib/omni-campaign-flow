-- Create user profiles table for storing user preferences per workspace
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Usuário',
  avatar_url text,
  email text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous access (temporary until auth is implemented)
CREATE POLICY "user_profiles_select_allow_anon" 
ON public.user_profiles 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "user_profiles_insert_allow_anon" 
ON public.user_profiles 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "user_profiles_update_allow_anon" 
ON public.user_profiles 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "user_profiles_delete_allow_anon" 
ON public.user_profiles 
FOR DELETE 
TO public
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default profile for existing workspaces
INSERT INTO public.user_profiles (workspace_id, name)
SELECT id, 'Usuário' 
FROM public.workspaces
ON CONFLICT DO NOTHING;