-- Criar tabela para persistir tags de contatos
CREATE TABLE public.contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  category TEXT NOT NULL DEFAULT 'custom',
  description TEXT,
  contact_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para mapear contatos às suas tags
CREATE TABLE public.contact_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

-- Criar tabela para armazenar contatos de forma persistente
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  has_whatsapp BOOLEAN NOT NULL DEFAULT false,
  last_contact TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para listas de contatos
CREATE TABLE public.contact_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  contact_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para associar contatos às listas
CREATE TABLE public.contact_list_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, contact_id)
);

-- Habilitar RLS
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_list_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas para contact_tags
CREATE POLICY "ct_sel" ON public.contact_tags FOR SELECT USING (is_member(workspace_id));
CREATE POLICY "ct_ins" ON public.contact_tags FOR INSERT WITH CHECK (is_member(workspace_id));
CREATE POLICY "ct_upd" ON public.contact_tags FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));
CREATE POLICY "ct_del" ON public.contact_tags FOR DELETE USING (is_member(workspace_id));

-- Políticas para contact_tag_assignments
CREATE POLICY "cta_sel" ON public.contact_tag_assignments FOR SELECT 
USING (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tag_assignments.contact_id AND is_member(c.workspace_id)));
CREATE POLICY "cta_ins" ON public.contact_tag_assignments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tag_assignments.contact_id AND is_member(c.workspace_id)));
CREATE POLICY "cta_upd" ON public.contact_tag_assignments FOR UPDATE 
USING (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tag_assignments.contact_id AND is_member(c.workspace_id)))
WITH CHECK (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tag_assignments.contact_id AND is_member(c.workspace_id)));
CREATE POLICY "cta_del" ON public.contact_tag_assignments FOR DELETE 
USING (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_tag_assignments.contact_id AND is_member(c.workspace_id)));

-- Políticas para contacts
CREATE POLICY "con_sel" ON public.contacts FOR SELECT USING (is_member(workspace_id));
CREATE POLICY "con_ins" ON public.contacts FOR INSERT WITH CHECK (is_member(workspace_id));
CREATE POLICY "con_upd" ON public.contacts FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));
CREATE POLICY "con_del" ON public.contacts FOR DELETE USING (is_member(workspace_id));

-- Políticas para contact_lists
CREATE POLICY "cl_sel" ON public.contact_lists FOR SELECT USING (is_member(workspace_id));
CREATE POLICY "cl_ins" ON public.contact_lists FOR INSERT WITH CHECK (is_member(workspace_id));
CREATE POLICY "cl_upd" ON public.contact_lists FOR UPDATE USING (is_member(workspace_id)) WITH CHECK (is_member(workspace_id));
CREATE POLICY "cl_del" ON public.contact_lists FOR DELETE USING (is_member(workspace_id));

-- Políticas para contact_list_assignments
CREATE POLICY "cla_sel" ON public.contact_list_assignments FOR SELECT 
USING (EXISTS (SELECT 1 FROM contact_lists cl WHERE cl.id = contact_list_assignments.list_id AND is_member(cl.workspace_id)));
CREATE POLICY "cla_ins" ON public.contact_list_assignments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM contact_lists cl WHERE cl.id = contact_list_assignments.list_id AND is_member(cl.workspace_id)));
CREATE POLICY "cla_upd" ON public.contact_list_assignments FOR UPDATE 
USING (EXISTS (SELECT 1 FROM contact_lists cl WHERE cl.id = contact_list_assignments.list_id AND is_member(cl.workspace_id)))
WITH CHECK (EXISTS (SELECT 1 FROM contact_lists cl WHERE cl.id = contact_list_assignments.list_id AND is_member(cl.workspace_id)));
CREATE POLICY "cla_del" ON public.contact_list_assignments FOR DELETE 
USING (EXISTS (SELECT 1 FROM contact_lists cl WHERE cl.id = contact_list_assignments.list_id AND is_member(cl.workspace_id)));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps automaticamente
CREATE TRIGGER update_contact_tags_updated_at
    BEFORE UPDATE ON public.contact_tags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at
    BEFORE UPDATE ON public.contact_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();