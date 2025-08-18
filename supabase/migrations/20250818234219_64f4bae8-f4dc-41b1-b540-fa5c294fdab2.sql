-- Create message_templates table with proper structure
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category TEXT NOT NULL DEFAULT 'UTILITY',
  components_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_statuses table for tracking approval status per number
CREATE TABLE IF NOT EXISTS public.template_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  phone_number_ref UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  review_reason TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for message_templates
CREATE POLICY "mt_sel" ON public.message_templates FOR SELECT USING (is_member(workspace_id));
CREATE POLICY "mt_ins" ON public.message_templates FOR INSERT WITH CHECK (is_member(workspace_id));
CREATE POLICY "mt_upd" ON public.message_templates FOR UPDATE USING (is_member(workspace_id));
CREATE POLICY "mt_del" ON public.message_templates FOR DELETE USING (is_member(workspace_id));

-- Enable RLS for template_statuses
ALTER TABLE public.template_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for template_statuses
CREATE POLICY "ts_sel" ON public.template_statuses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM message_templates mt 
    WHERE mt.id = template_statuses.template_id AND is_member(mt.workspace_id)
  )
);
CREATE POLICY "ts_ins" ON public.template_statuses FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM message_templates mt 
    WHERE mt.id = template_statuses.template_id AND is_member(mt.workspace_id)
  )
);
CREATE POLICY "ts_upd" ON public.template_statuses FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM message_templates mt 
    WHERE mt.id = template_statuses.template_id AND is_member(mt.workspace_id)
  )
);
CREATE POLICY "ts_del" ON public.template_statuses FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM message_templates mt 
    WHERE mt.id = template_statuses.template_id AND is_member(mt.workspace_id)
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_statuses_updated_at
  BEFORE UPDATE ON public.template_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_message_templates_workspace_id ON public.message_templates(workspace_id);
CREATE INDEX idx_template_statuses_template_id ON public.template_statuses(template_id);
CREATE INDEX idx_template_statuses_phone_number_ref ON public.template_statuses(phone_number_ref);