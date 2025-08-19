import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Audience = Database["public"]["Tables"]["audiences"]["Row"];
type AudienceItem = Database["public"]["Tables"]["audience_items"]["Row"];

export interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  tags: string[];
  lastContact?: string;
  hasWhatsapp: boolean;
  source: string;
  validation_status: string;
  raw_msisdn: string;
  e164?: string;
  wa_id?: string;
  opt_in?: boolean;
}

export interface ContactList {
  id: string;
  name: string;
  contacts: number;
  lastUpdated: string;
  tags: string[];
  status: string;
  workspace_id: string;
  created_at?: string;
  valid_count?: number;
  invalid_count?: number;
  total?: number;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    withWhatsapp: 0,
    withoutWhatsapp: 0,
    activeLists: 0
  });
  const { toast } = useToast();

  // Carregando listas de contatos filtradas por workspace
  const loadContactLists = useCallback(async (workspaceId?: string) => {
    if (!workspaceId) {
      setContactLists([]);
      setTotalStats({ total: 0, withWhatsapp: 0, withoutWhatsapp: 0, activeLists: 0 });
      return;
    }
    
    setLoading(true);
    try {
      const { data: audiences, error } = await supabase
        .from("audiences")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const lists: ContactList[] = audiences?.map(audience => ({
        id: audience.id,
        name: audience.name,
        contacts: audience.total || 0,
        lastUpdated: new Date(audience.created_at || "").toLocaleDateString(),
        tags: [], // Tags serão implementadas depois
        status: "active",
        workspace_id: audience.workspace_id,
        created_at: audience.created_at,
        valid_count: audience.valid_count,
        invalid_count: audience.invalid_count,
        total: audience.total
      })) || [];

      setContactLists(lists);

      // Calcular estatísticas
      const total = lists.reduce((sum, list) => sum + list.contacts, 0);
      const activeLists = lists.filter(list => list.status === "active").length;
      
      setTotalStats({
        total,
        withWhatsapp: Math.round(total * 0.89), // Estimativa
        withoutWhatsapp: Math.round(total * 0.11),
        activeLists
      });

    } catch (error) {
      console.error("Failed to load contact lists:", error);
      toast({
        title: "Erro ao carregar listas",
        description: "Não foi possível carregar as listas de contatos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carregando contatos de uma lista específica
  const loadContacts = useCallback(async (audienceId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("audience_items")
        .select("*");

      if (audienceId) {
        query = query.eq("audience_id", audienceId);
      }

      const { data: audienceItems, error } = await query
        .order("raw_msisdn")
        .limit(100); // Limitar para performance

      if (error) throw error;

      const contactsData: Contact[] = audienceItems?.map(item => ({
        id: item.id,
        phone: item.e164 || item.raw_msisdn,
        raw_msisdn: item.raw_msisdn,
        e164: item.e164,
        validation_status: item.validation_status,
        hasWhatsapp: !!item.wa_id,
        wa_id: item.wa_id,
        opt_in: item.opt_in,
        tags: [], // Tags serão implementadas depois
        source: "Import", // Default source
        lastContact: "Nunca",
        name: undefined,
        email: undefined
      })) || [];

      setContacts(contactsData);

    } catch (error) {
      console.error("Failed to load contacts:", error);
      toast({
        title: "Erro ao carregar contatos",
        description: "Não foi possível carregar os contatos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Criar nova lista de contatos
  const createContactList = useCallback(async (name: string, workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from("audiences")
        .insert([{
          name,
          workspace_id: workspaceId,
          total: 0,
          valid_count: 0,
          invalid_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Lista criada",
        description: `Lista "${name}" criada com sucesso.`,
      });

      // Note: loadContactLists will be called by consuming component with workspaceId
      return data;

    } catch (error) {
      console.error("Failed to create contact list:", error);
      toast({
        title: "Erro ao criar lista",
        description: "Não foi possível criar a lista de contatos.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Importar contatos via CSV
  const importContactsFromCSV = useCallback(async (
    audienceId: string, 
    csvData: Array<{ phone: string; name?: string; email?: string }>
  ) => {
    try {
      const contactsToInsert = csvData.map(row => ({
        audience_id: audienceId,
        raw_msisdn: row.phone,
        validation_status: "PENDING" as const,
        opt_in: false
      }));

      const { error } = await supabase
        .from("audience_items")
        .insert(contactsToInsert);

      if (error) throw error;

      // Atualizar contador da audience
      const { error: updateError } = await supabase
        .from("audiences")
        .update({ total: csvData.length })
        .eq("id", audienceId);

      if (updateError) throw updateError;

      toast({
        title: "Importação concluída",
        description: `${csvData.length} contatos importados com sucesso.`,
      });

      // Note: loadContactLists will be called by consuming component with workspaceId
      await loadContacts(audienceId);

    } catch (error) {
      console.error("Failed to import contacts:", error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os contatos.",
        variant: "destructive",
      });
    }
  }, [toast, loadContacts]);

  // Atualizar contato
  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from("audience_items")
        .update({
          validation_status: updates.validation_status,
          e164: updates.e164,
          wa_id: updates.wa_id,
          opt_in: updates.opt_in
        })
        .eq("id", contactId);

      if (error) throw error;

      // Atualizar estado local
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, ...updates } : contact
      ));

      toast({
        title: "Contato atualizado",
        description: "Informações do contato foram atualizadas.",
      });

    } catch (error) {
      console.error("Failed to update contact:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o contato.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Remove auto-loading on mount since we need workspaceId
  // Components should call loadContactLists(workspaceId) when workspace is available

  return {
    contacts,
    contactLists,
    loading,
    totalStats,
    loadContactLists,
    loadContacts,
    createContactList,
    importContactsFromCSV,
    updateContact
  };
}