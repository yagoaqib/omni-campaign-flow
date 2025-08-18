-- Create message_templates table for real template persistence
CREATE TABLE public.message_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  waba_id text NOT NULL,
  name text NOT NULL,
  language text NOT NULL DEFAULT 'pt_BR',
  category text NOT NULL DEFAULT 'UTILITY',
  status text NOT NULL DEFAULT 'PENDING',
  components_schema jsonb NOT NULL DEFAULT '[]',
  workspace_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "mt_sel" ON public.message_templates
  FOR SELECT USING (is_member(workspace_id));

CREATE POLICY "mt_ins" ON public.message_templates
  FOR INSERT WITH CHECK (is_member(workspace_id));

CREATE POLICY "mt_upd" ON public.message_templates
  FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));

CREATE POLICY "mt_del" ON public.message_templates
  FOR DELETE USING (is_member(workspace_id));

-- Create trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();