import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { TemplateModel } from "@/components/templates/types";

type Template = Database["public"]["Tables"]["templates"]["Row"];

export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateModel[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async (workspaceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert Supabase data to TemplateModel format
      const convertedTemplates: TemplateModel[] = data.map(template => {
        const schema = template.components_schema as any;
        return {
          id: template.id,
          name: template.name,
          language: template.language,
          category: template.category as any,
          headerType: schema?.header?.type || "NONE",
          headerText: schema?.header?.text,
          body: schema?.body?.text || "",
          footer: schema?.footer?.text,
          buttons: schema?.buttons || [],
          createdAt: template.created_at,
          updatedAt: template.created_at,
          wabaStatuses: []
        };
      });

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
      const { error } = await supabase
        .from("templates")
        .upsert({
          id: template.id,
          name: template.name,
          language: template.language,
          category: template.category,
          components_schema: {
            header: { type: template.headerType, text: template.headerText },
            body: { text: template.body },
            footer: template.footer ? { text: template.footer } : null,
            buttons: template.buttons.map(btn => ({
              id: btn.id,
              type: btn.type,
              text: btn.text,
              url: btn.url || null,
              phone: btn.phone || null
            }))
          } as any,
          workspace_id: workspaceId,
          waba_ref: wabaId,
          status: "DRAFT"
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
        .from("templates")
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