import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { toast } from 'sonner';

export interface ContactTag {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  color: string;
  category: 'custom' | 'funnel' | 'behavior';
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContactTagAssignment {
  id: string;
  contact_id: string;
  tag_id: string;
  assigned_at: string;
}

export function useContactTags() {
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  const loadTags = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('name');

      if (error) throw error;
      setTags((data as any) || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (tagData: Partial<ContactTag>) => {
    if (!activeWorkspace?.id) return;

    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .insert({
          name: tagData.name || '',
          workspace_id: activeWorkspace.id,
          ...tagData
        })
        .select()
        .single();

      if (error) throw error;

      await loadTags();
      toast.success('Tag criada com sucesso');
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag');
      throw error;
    }
  };

  const updateTag = async (id: string, updates: Partial<ContactTag>) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadTags();
      toast.success('Tag atualizada com sucesso');
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Erro ao atualizar tag');
      throw error;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      // First remove all assignments
      await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('tag_id', id);

      // Then delete the tag
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadTags();
      toast.success('Tag removida com sucesso');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Erro ao remover tag');
      throw error;
    }
  };

  const assignTagToContact = async (contactId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('contact_tag_assignments')
        .insert({
          contact_id: contactId,
          tag_id: tagId
        });

      if (error) throw error;

      // Update tag contact count
      await updateTagContactCount(tagId);
      await loadTags();
    } catch (error) {
      console.error('Error assigning tag:', error);
      toast.error('Erro ao atribuir tag');
      throw error;
    }
  };

  const removeTagFromContact = async (contactId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);

      if (error) throw error;

      // Update tag contact count
      await updateTagContactCount(tagId);
      await loadTags();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Erro ao remover tag');
      throw error;
    }
  };

  const getContactTags = async (contactId: string): Promise<ContactTag[]> => {
    try {
      const { data, error } = await supabase
        .from('contact_tag_assignments')
        .select(`
          tag_id,
          contact_tags (*)
        `)
        .eq('contact_id', contactId);

      if (error) throw error;

      return (data || []).map((assignment: any) => assignment.contact_tags).filter(Boolean);
    } catch (error) {
      console.error('Error getting contact tags:', error);
      return [];
    }
  };

  const updateTagContactCount = async (tagId: string) => {
    try {
      const { count, error } = await supabase
        .from('contact_tag_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tagId);

      if (error) throw error;

      await supabase
        .from('contact_tags')
        .update({ contact_count: count || 0 })
        .eq('id', tagId);
    } catch (error) {
      console.error('Error updating tag count:', error);
    }
  };

  useEffect(() => {
    loadTags();
  }, [activeWorkspace?.id]);

  return {
    tags,
    loading,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    assignTagToContact,
    removeTagFromContact,
    getContactTags
  };
}