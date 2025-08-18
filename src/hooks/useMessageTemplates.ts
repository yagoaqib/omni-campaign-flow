import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useToast } from './use-toast';

export interface MessageTemplate {
  id: string;
  wabaId: string;
  name: string;
  language: string;
  category: string;
  status: string;
  componentsSchema: any;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export function useMessageTemplates() {
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    if (!activeWorkspace) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTemplates = (data || []).map(template => ({
        id: template.id,
        wabaId: template.waba_id,
        name: template.name,
        language: template.language,
        category: template.category,
        status: template.status,
        componentsSchema: template.components_schema,
        workspaceId: template.workspace_id,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }));

      setTemplates(mappedTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          waba_id: templateData.wabaId,
          name: templateData.name,
          language: templateData.language,
          category: templateData.category,
          status: templateData.status,
          components_schema: templateData.componentsSchema,
          workspace_id: templateData.workspaceId
        });

      if (error) throw error;

      await loadTemplates();
      toast({
        title: "Sucesso",
        description: "Template salvo com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar template",
        variant: "destructive"
      });
    }
  };

  const updateTemplate = async (templateId: string, updates: Partial<MessageTemplate>) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          ...(updates.wabaId && { waba_id: updates.wabaId }),
          ...(updates.name && { name: updates.name }),
          ...(updates.language && { language: updates.language }),
          ...(updates.category && { category: updates.category }),
          ...(updates.status && { status: updates.status }),
          ...(updates.componentsSchema && { components_schema: updates.componentsSchema })
        })
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: "Sucesso",
        description: "Template atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar template",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [activeWorkspace]);

  return {
    templates,
    loading,
    loadTemplates,
    saveTemplate,
    updateTemplate
  };
}