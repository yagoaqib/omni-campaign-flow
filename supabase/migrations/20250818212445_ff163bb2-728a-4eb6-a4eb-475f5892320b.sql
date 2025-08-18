-- Add client-specific Meta WhatsApp Cloud credentials on WABAs
-- Safe alterations with indexes; RLS already exists via is_member(workspace_id)

-- Ensure columns exist only once (idempotent-ish by IF NOT EXISTS)
ALTER TABLE public.wabas
  ADD COLUMN IF NOT EXISTS verify_token text,
  ADD COLUMN IF NOT EXISTS app_secret   text,
  ADD COLUMN IF NOT EXISTS access_token text;

-- Helpful indexes for webhook routing and lookups
CREATE INDEX IF NOT EXISTS idx_wabas_waba_id ON public.wabas (waba_id);
CREATE INDEX IF NOT EXISTS idx_wabas_verify_token ON public.wabas (verify_token);

-- Optional uniqueness to avoid ambiguous routing by verify_token
-- If you prefer allowing same token across clients, we can drop this.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wabas_verify_token_unique'
  ) THEN
    ALTER TABLE public.wabas
    ADD CONSTRAINT wabas_verify_token_unique UNIQUE (verify_token);
  END IF;
END $$;