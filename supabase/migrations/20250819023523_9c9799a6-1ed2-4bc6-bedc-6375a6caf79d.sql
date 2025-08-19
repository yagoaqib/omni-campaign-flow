-- Remove security-definer-related linter warnings by dropping views
DROP VIEW IF EXISTS public.contacts_secure;
DROP VIEW IF EXISTS public.audience_items_secure;