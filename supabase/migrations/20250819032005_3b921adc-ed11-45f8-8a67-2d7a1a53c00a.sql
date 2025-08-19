-- Add encrypted columns for WABA sensitive credentials
ALTER TABLE public.wabas
  ADD COLUMN IF NOT EXISTS access_token_enc text,
  ADD COLUMN IF NOT EXISTS app_secret_enc text,
  ADD COLUMN IF NOT EXISTS verify_token_enc text;

-- Optional: comments for clarity
COMMENT ON COLUMN public.wabas.access_token_enc IS 'AES-GCM encrypted access token, base64(iv||ciphertext)';
COMMENT ON COLUMN public.wabas.app_secret_enc IS 'AES-GCM encrypted app secret, base64(iv||ciphertext)';
COMMENT ON COLUMN public.wabas.verify_token_enc IS 'AES-GCM encrypted verify token, base64(iv||ciphertext)';