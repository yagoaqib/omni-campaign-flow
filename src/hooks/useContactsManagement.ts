import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useToast } from './use-toast';

export interface ContactTag {
  id: string;
  name: string;
  color: string;
  category: "funnel" | "behavior" | "custom";
  description?: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContactData {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  source: string;
  has_whatsapp: boolean;
  last_contact?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ContactList {
  id: string;
  name: string;
  status: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export function useContactsManagement() {
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar tags
  const loadTags = async () => {
    if (!activeWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTags((data || []).map(tag => ({
        ...tag,
        category: tag.category as "funnel" | "behavior" | "custom"
      })));
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao carregar tags", 
        variant: "destructive" 
      });
    }
  };

  // Carregar contatos com suas tags
  const loadContacts = async () => {
    if (!activeWorkspace) return;

    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Carregar tags para cada contato
      const contactsWithTags = await Promise.all(
        (contactsData || []).map(async (contact) => {
          const { data: tagAssignments } = await supabase
            .from('contact_tag_assignments')
            .select('tag_id')
            .eq('contact_id', contact.id);

          return {
            ...contact,
            tags: tagAssignments?.map(ta => ta.tag_id) || []
          };
        })
      );

      setContacts(contactsWithTags);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao carregar contatos", 
        variant: "destructive" 
      });
    }
  };

  // Carregar listas de contatos
  const loadContactLists = async () => {
    if (!activeWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao carregar listas", 
        variant: "destructive" 
      });
    }
  };

  // Salvar tag
  const saveTag = async (tagData: Omit<ContactTag, 'id' | 'created_at' | 'updated_at'>) => {
    if (!activeWorkspace) return null;

    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .insert([{
          ...tagData,
          workspace_id: activeWorkspace.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadTags();
      toast({ title: "Sucesso", description: "Tag criada com sucesso" });
      
      return {
        ...data,
        category: data.category as "funnel" | "behavior" | "custom"
      } as ContactTag;
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao criar tag", 
        variant: "destructive" 
      });
      return null;
    }
  };

  // Atualizar tag
  const updateTag = async (tagId: string, updates: Partial<ContactTag>) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .update(updates)
        .eq('id', tagId);

      if (error) throw error;
      
      await loadTags();
      toast({ title: "Sucesso", description: "Tag atualizada com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao atualizar tag", 
        variant: "destructive" 
      });
    }
  };

  // Deletar tag
  const deleteTag = async (tagId: string) => {
    try {
      // Primeiro remover todas as atribuições da tag
      await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('tag_id', tagId);

      // Depois deletar a tag
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      
      await loadTags();
      await loadContacts();
      toast({ title: "Sucesso", description: "Tag removida com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao remover tag", 
        variant: "destructive" 
      });
    }
  };

  // Salvar contato
  const saveContact = async (contactData: Omit<ContactData, 'id' | 'tags' | 'created_at' | 'updated_at'>) => {
    if (!activeWorkspace) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contactData,
          workspace_id: activeWorkspace.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadContacts();
      toast({ title: "Sucesso", description: "Contato criado com sucesso" });
      return data;
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao criar contato", 
        variant: "destructive" 
      });
      return null;
    }
  };

  // Atualizar tags de um contato
  const updateContactTags = async (contactId: string, tagIds: string[]) => {
    try {
      // Remover tags existentes
      await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('contact_id', contactId);

      // Adicionar novas tags
      if (tagIds.length > 0) {
        const assignments = tagIds.map(tagId => ({
          contact_id: contactId,
          tag_id: tagId
        }));

        const { error } = await supabase
          .from('contact_tag_assignments')
          .insert(assignments);

        if (error) throw error;
      }

      await loadContacts();
      toast({ title: "Sucesso", description: "Tags do contato atualizadas" });
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao atualizar tags", 
        variant: "destructive" 
      });
    }
  };

  // Criar lista de contatos
  const createContactList = async (listData: Omit<ContactList, 'id' | 'created_at' | 'updated_at'>) => {
    if (!activeWorkspace) return null;

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .insert([{
          ...listData,
          workspace_id: activeWorkspace.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadContactLists();
      toast({ title: "Sucesso", description: "Lista criada com sucesso" });
      return data;
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast({ 
        title: "Erro", 
        description: "Falha ao criar lista", 
        variant: "destructive" 
      });
      return null;
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (activeWorkspace) {
      setLoading(true);
      Promise.all([
        loadTags(),
        loadContacts(),
        loadContactLists()
      ]).finally(() => setLoading(false));
    }
  }, [activeWorkspace]);

  // Estatísticas calculadas
  const totalStats = {
    total: contacts.length,
    withWhatsapp: contacts.filter(c => c.has_whatsapp).length,
    withoutWhatsapp: contacts.filter(c => !c.has_whatsapp).length,
    activeLists: contactLists.filter(l => l.status === 'active').length
  };

  return {
    // Estado
    tags,
    contacts,
    contactLists,
    loading,
    totalStats,
    
    // Métodos
    saveTag,
    updateTag,
    deleteTag,
    saveContact,
    updateContactTags,
    createContactList,
    refreshData: () => Promise.all([loadTags(), loadContacts(), loadContactLists()])
  };
}