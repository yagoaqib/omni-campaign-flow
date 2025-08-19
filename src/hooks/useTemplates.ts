import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { TemplateModel } from "@/components/templates/types";

type MessageTemplate = Database["public"]["Tables"]["message_templates"]["Row"];

export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateModel[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async (workspaceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert message_templates data to TemplateModel format with real status data
      const convertedTemplates: TemplateModel[] = await Promise.all(
        (data || []).map(async (template) => {
          const schema = (template.components_schema as any[]) || [];
          
          // Extract components from schema array
          const headerComponent = schema.find(c => c.type === 'HEADER');
          const bodyComponent = schema.find(c => c.type === 'BODY');
          const footerComponent = schema.find(c => c.type === 'FOOTER');
          const buttonsComponent = schema.find(c => c.type === 'BUTTONS');
          
          // Get real WABA statuses from template_statuses table
          const { data: statusData } = await supabase
            .from('template_statuses')
            .select(`
              status,
              review_reason,
              phone_number_ref,
              phone_numbers!inner(display_number)
            `)
            .eq('template_id', template.id);

          const wabaStatuses = (statusData || []).map((status: any) => ({
            wabaId: status.phone_number_ref,
            phoneName: status.phone_numbers?.display_number || 'Número desconhecido',
            status: status.status,
            lastSyncAt: new Date().toISOString(),
            reviewReason: status.review_reason
          }));

          return {
            id: template.id,
            name: template.name,
            language: template.language,
            category: template.category as any,
            headerType: headerComponent?.format || "NONE",
            headerText: headerComponent?.text,
            body: bodyComponent?.text || "",
            footer: footerComponent?.text,
            buttons: buttonsComponent?.buttons?.map((btn: any) => ({
              id: crypto.randomUUID(),
              type: btn.type,
              text: btn.text,
              url: btn.url,
              phone: btn.phone_number
            })) || [],
            createdAt: template.created_at,
            updatedAt: template.updated_at,
            wabaStatuses
          };
        })
      );

      setTemplates(convertedTemplates);
    } catch (error) {
      console.error("Failed to load templates:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async (template: TemplateModel, workspaceId: string, wabaId: string) => {
    try {
      // Build proper components_schema array for message_templates
      const components_schema = [];
      
      if (template.headerType && template.headerType !== "NONE") {
        components_schema.push({
          type: 'HEADER',
          format: template.headerType,
          text: template.headerText
        });
      }
      
      if (template.body) {
        components_schema.push({
          type: 'BODY',
          text: template.body
        });
      }
      
      if (template.footer) {
        components_schema.push({
          type: 'FOOTER',
          text: template.footer
        });
      }
      
      if (template.buttons && template.buttons.length > 0) {
        components_schema.push({
          type: 'BUTTONS',
          buttons: template.buttons.map(btn => ({
            type: btn.type,
            text: btn.text,
            url: btn.url,
            phone_number: btn.phone
          }))
        });
      }

      const { error } = await supabase
        .from("message_templates")
        .upsert({
          id: template.id,
          name: template.name,
          language: template.language,
          category: template.category,
          components_schema,
          workspace_id: workspaceId,
          waba_id: wabaId,
          status: "PENDING"
        });

      if (error) throw error;

      // Update local state
      setTemplates(prev => {
        const exists = prev.some(t => t.id === template.id);
        return exists 
          ? prev.map(t => t.id === template.id ? template : t)
          : [template, ...prev];
      });

      return true;
    } catch (error) {
      console.error("Failed to save template:", error);
      throw error;
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      return true;
    } catch (error) {
      console.error("Failed to delete template:", error);
      throw error;
    }
  }, []);

  return {
    templates,
    loading,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
  };
}