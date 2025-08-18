-- Create notifications system for alerts and async events
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid,
  type text NOT NULL, -- 'campaign_completed', 'template_rejected', 'webhook_error', etc.
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "notifications_sel" ON public.notifications
  FOR SELECT USING (is_member(workspace_id));

CREATE POLICY "notifications_ins" ON public.notifications
  FOR INSERT WITH CHECK (is_member(workspace_id));

CREATE POLICY "notifications_upd" ON public.notifications
  FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));

CREATE POLICY "notifications_del" ON public.notifications
  FOR DELETE USING (is_member(workspace_id));

-- Create index for performance
CREATE INDEX idx_notifications_workspace_created ON public.notifications(workspace_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;