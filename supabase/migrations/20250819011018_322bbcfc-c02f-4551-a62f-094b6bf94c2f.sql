-- Create initial workspaces if they don't exist
INSERT INTO public.workspaces (name) 
VALUES 
  ('Empresa Principal'),
  ('Filial São Paulo'), 
  ('Filial Rio de Janeiro')
ON CONFLICT DO NOTHING;