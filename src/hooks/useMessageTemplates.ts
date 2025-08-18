import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  workspace_id: string;
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING';
  components_schema: any[];
  waba_id: string;
  phone_number_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  template_statuses?: {
    phone_number_ref: string;
    status: string;
    review_reason?: string;
    synced_at: string;
  }[];
}

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  const loadTemplates = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select(`
          *,
          template_statuses(
            phone_number_ref,
            status,
            review_reason,
            synced_at
          )
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const syncTemplateStatuses = async (phoneNumberId: string) => {
    if (!activeWorkspace?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('sync-template-statuses', {
        body: { phoneNumberId, workspaceId: activeWorkspace.id }
      });

      if (error) throw error;
      
      await loadTemplates(); // Reload templates to get updated statuses
      toast.success(`${data.syncedCount} templates sincronizados, ${data.newCount} novos importados`);
    } catch (error) {
      console.error('Error syncing templates:', error);
      toast.error('Erro ao sincronizar templates');
    }
  };

  const createTemplate = async (templateData: Partial<MessageTemplate>) => {
    if (!activeWorkspace?.id) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          name: templateData.name || '',
          waba_id: templateData.waba_id || '',
          workspace_id: activeWorkspace.id,
          ...templateData
        });

      if (error) throw error;
      
      await loadTemplates();
      toast.success('Template criado com sucesso');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await loadTemplates();
      toast.success('Template atualizado com sucesso');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadTemplates();
      toast.success('Template excluído com sucesso');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [activeWorkspace?.id]);

  return {
    templates,
    loading,
    loadTemplates,
    syncTemplateStatuses,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
}