-- Create number validation results table
CREATE TABLE public.number_validation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  reason TEXT NOT NULL, -- invalid_format, landline, no_whatsapp, blocked, duplicate
  description TEXT,
  cost DECIMAL(10,4) DEFAULT 0,
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template statuses table
CREATE TABLE public.template_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  phone_number_ref UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- APPROVED, REJECTED, PENDING
  review_reason TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cascade policies table
CREATE TABLE public.cascade_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  numbers_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  number_quotas JSONB NOT NULL DEFAULT '{}'::jsonb,
  min_quality TEXT NOT NULL DEFAULT 'HIGH',
  template_stack_util UUID,
  template_stack_mkt UUID,
  desired_category TEXT NOT NULL DEFAULT 'UTILITY',
  retry_max INTEGER NOT NULL DEFAULT 3,
  retry_backoff_sec INTEGER NOT NULL DEFAULT 60,
  per_number JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.number_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cascade_policies ENABLE ROW LEVEL SECURITY;

-- RLS policies for number_validation_results
CREATE POLICY "nvr_sel" ON public.number_validation_results FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM contacts c 
  WHERE c.id = number_validation_results.contact_id 
  AND is_member(c.workspace_id)
));

CREATE POLICY "nvr_ins" ON public.number_validation_results FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM contacts c 
  WHERE c.id = number_validation_results.contact_id 
  AND is_member(c.workspace_id)
));

CREATE POLICY "nvr_upd" ON public.number_validation_results FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM contacts c 
  WHERE c.id = number_validation_results.contact_id 
  AND is_member(c.workspace_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM contacts c 
  WHERE c.id = number_validation_results.contact_id 
  AND is_member(c.workspace_id)
));

CREATE POLICY "nvr_del" ON public.number_validation_results FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM contacts c 
  WHERE c.id = number_validation_results.contact_id 
  AND is_member(c.workspace_id)
));

-- RLS policies for template_statuses
CREATE POLICY "ts_sel" ON public.template_statuses FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM message_templates mt 
  WHERE mt.id = template_statuses.template_id 
  AND is_member(mt.workspace_id)
));

CREATE POLICY "ts_ins" ON public.template_statuses FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM message_templates mt 
  WHERE mt.id = template_statuses.template_id 
  AND is_member(mt.workspace_id)
));

CREATE POLICY "ts_upd" ON public.template_statuses FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM message_templates mt 
  WHERE mt.id = template_statuses.template_id 
  AND is_member(mt.workspace_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM message_templates mt 
  WHERE mt.id = template_statuses.template_id 
  AND is_member(mt.workspace_id)
));

CREATE POLICY "ts_del" ON public.template_statuses FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM message_templates mt 
  WHERE mt.id = template_statuses.template_id 
  AND is_member(mt.workspace_id)
));

-- RLS policies for cascade_policies
CREATE POLICY "cp_sel" ON public.cascade_policies FOR SELECT 
USING (is_member(workspace_id));

CREATE POLICY "cp_ins" ON public.cascade_policies FOR INSERT 
WITH CHECK (is_member(workspace_id));

CREATE POLICY "cp_upd" ON public.cascade_policies FOR UPDATE 
USING (is_member(workspace_id))
WITH CHECK (is_member(workspace_id));

CREATE POLICY "cp_del" ON public.cascade_policies FOR DELETE 
USING (is_member(workspace_id));

-- Create triggers for updated_at
CREATE TRIGGER update_template_statuses_updated_at
  BEFORE UPDATE ON public.template_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cascade_policies_updated_at
  BEFORE UPDATE ON public.cascade_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_number_validation_results_contact_id ON public.number_validation_results(contact_id);
CREATE INDEX idx_template_statuses_template_id ON public.template_statuses(template_id);
CREATE INDEX idx_template_statuses_phone_number_ref ON public.template_statuses(phone_number_ref);
CREATE INDEX idx_cascade_policies_campaign_id ON public.cascade_policies(campaign_id);

-- Add cascade_policy_id to campaigns table
ALTER TABLE public.campaigns ADD COLUMN cascade_policy_id UUID;