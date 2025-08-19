import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useContactTags } from './useContactTags';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  workspace_id: string;
  phone: string;
  name?: string;
  email?: string;
  source: string;
  has_whatsapp: boolean;
  last_contact?: string;
  created_at: string;
  updated_at: string;
  tags: string[]; // Array of tag IDs
}

export interface ContactList {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

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

export function useContactsManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();
  const { tags, loadTags, createTag, updateTag, deleteTag, assignTagToContact, removeTagFromContact } = useContactTags();

  const [totalStats, setTotalStats] = useState({
    total: 0,
    withWhatsapp: 0,
    withoutWhatsapp: 0,
    activeLists: 0
  });

  const loadContacts = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setLoading(true);
      
      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', activeWorkspace.id);

      if (contactsError) throw contactsError;

      // Load contact tag assignments separately
      const { data: tagAssignments } = await supabase
        .from('contact_tag_assignments')
        .select('contact_id, tag_id');

      // Process contacts and group tags
      const processedContacts: Contact[] = (contactsData || []).map((contact: any) => ({
        ...contact,
        tags: (tagAssignments || [])
          .filter(assignment => assignment.contact_id === contact.id)
          .map(assignment => assignment.tag_id)
      }));

      setContacts(processedContacts);

      // Calculate stats
      setTotalStats({
        total: processedContacts.length,
        withWhatsapp: processedContacts.filter(c => c.has_whatsapp).length,
        withoutWhatsapp: processedContacts.filter(c => !c.has_whatsapp).length,
        activeLists: contactLists.filter(l => l.status === 'active').length
      });

    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  const loadContactLists = async () => {
    if (!activeWorkspace?.id) return;

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setContactLists((data as any) || []);
    } catch (error) {
      console.error('Error loading contact lists:', error);
      toast.error('Erro ao carregar listas de contatos');
    }
  };

  const saveTag = async (tagData: Partial<ContactTag>) => {
    try {
      const result = await createTag(tagData);
      await loadTags();
      return result as ContactTag;
    } catch (error) {
      console.error('Error saving tag:', error);
      return null;
    }
  };

  const updateContactTags = async (contactId: string, newTags: string[]) => {
    try {
      // Get current tags for this contact
      const { data: currentAssignments } = await supabase
        .from('contact_tag_assignments')
        .select('tag_id')
        .eq('contact_id', contactId);

      const currentTagIds = (currentAssignments || []).map(a => a.tag_id);

      // Remove tags that are no longer assigned
      const tagsToRemove = currentTagIds.filter(tagId => !newTags.includes(tagId));
      for (const tagId of tagsToRemove) {
        await removeTagFromContact(contactId, tagId);
      }

      // Add new tags
      const tagsToAdd = newTags.filter(tagId => !currentTagIds.includes(tagId));
      for (const tagId of tagsToAdd) {
        await assignTagToContact(contactId, tagId);
      }

      // Reload contacts and tags
      await loadContacts();
      await loadTags();
      
      toast.success('Tags atualizadas com sucesso');
    } catch (error) {
      console.error('Error updating contact tags:', error);
      toast.error('Erro ao atualizar tags do contato');
    }
  };

  const createContactList = async (name: string) => {
    if (!activeWorkspace?.id) return;

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .insert({
          name,
          workspace_id: activeWorkspace.id,
          status: 'active',
          contact_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      await loadContactLists();
      toast.success('Lista criada com sucesso');
      return data;
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast.error('Erro ao criar lista');
      throw error;
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadContacts();
      loadContactLists();
    }
  }, [activeWorkspace?.id]);

  return {
    contacts,
    contactLists,
    tags,
    totalStats,
    loading,
    loadContacts,
    loadContactLists,
    saveTag,
    updateTag,
    deleteTag,
    updateContactTags,
    createContactList
  };
}