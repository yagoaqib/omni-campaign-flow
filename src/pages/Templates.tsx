import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, PlusCircle } from "lucide-react"
import TemplateBuilder from "@/components/templates/TemplateBuilder"
import TemplateList from "@/components/templates/TemplateList"
import WABAStatusMatrix from "@/components/templates/WABAStatusMatrix"
import { TemplateStatusDisplay } from "@/components/templates/TemplateStatusDisplay"
import { TemplateModel, WABAStatus } from "@/components/templates/types"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useWorkspace } from "@/hooks/useWorkspace"
import { supabase } from "@/integrations/supabase/client"

const Templates = () => {
  const [templates, setTemplates] = useState<TemplateModel[]>([])
  const [activeTab, setActiveTab] = useState<string>("catalog")
  const [editing, setEditing] = useState<TemplateModel | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { activeWorkspace } = useWorkspace()

  // Load templates from Supabase
  useEffect(() => {
    document.title = "Modelos WhatsApp – Builder e Catálogo"
    loadTemplates()
  }, [activeWorkspace])

  const loadTemplates = async () => {
    if (!activeWorkspace) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Convert message_templates data to TemplateModel format with real template_statuses
      const convertedTemplates: TemplateModel[] = await Promise.all(
        (data || []).map(async (template) => {
          const schema = (template.components_schema as any[]) || [];
          
          // Extract header info
          const headerComponent = schema.find((c: any) => c.type === 'HEADER');
          const bodyComponent = schema.find((c: any) => c.type === 'BODY');
          const footerComponent = schema.find((c: any) => c.type === 'FOOTER');
          const buttonsComponent = schema.find((c: any) => c.type === 'BUTTONS');
          
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
      )
      
      setTemplates(convertedTemplates)
    } catch (error) {
      console.error("Failed to load templates:", error)
      toast({ 
        title: "Erro", 
        description: "Falha ao carregar templates.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const onSave = async (tpl: TemplateModel) => {
    if (!activeWorkspace) return

    try {
      // Save to message_templates with proper components_schema
      const components_schema = [];
      
      // Add header component
      if (tpl.headerType && tpl.headerType !== "NONE") {
        components_schema.push({
          type: 'HEADER',
          format: tpl.headerType,
          text: tpl.headerText
        });
      }
      
      // Add body component
      if (tpl.body) {
        components_schema.push({
          type: 'BODY',
          text: tpl.body
        });
      }
      
      // Add footer component
      if (tpl.footer) {
        components_schema.push({
          type: 'FOOTER',
          text: tpl.footer
        });
      }
      
      // Add buttons component
      if (tpl.buttons && tpl.buttons.length > 0) {
        components_schema.push({
          type: 'BUTTONS',
          buttons: tpl.buttons.map(btn => ({
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
          id: tpl.id,
          name: tpl.name,
          language: tpl.language,
          category: tpl.category,
          components_schema,
          workspace_id: activeWorkspace.id,
          waba_id: tpl.assignedNumberId || "",
          status: "PENDING"
        })

      if (error) throw error

      // Update local state
      setTemplates((prev) => {
        const exists = prev.some((p) => p.id === tpl.id)
        const next = exists ? prev.map((p) => (p.id === tpl.id ? tpl : p)) : [tpl, ...prev]
        return next
      })
      setEditing(tpl)
      setActiveTab("catalog")
      toast({ title: "Modelo salvo", description: `Modelo \"${tpl.name}\" salvo no catálogo.` })
    } catch (error) {
      console.error("Failed to save template:", error)
      toast({ 
        title: "Erro", 
        description: "Falha ao salvar template.", 
        variant: "destructive" 
      })
    }
  }

  const onEdit = (tpl: TemplateModel) => {
    setEditing(tpl)
    setActiveTab("create")
  }

  const onSync = (tpl: TemplateModel) => {
    setEditing(tpl)
    setActiveTab("create")
  }

  const updateStatuses = async (next: any[]) => {
    if (!editing) return
    const updated: TemplateModel = { ...editing, wabaStatuses: next, updatedAt: new Date().toISOString() }
    setEditing(updated)
    setTemplates((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    // Reload templates to get fresh data from database
    await loadTemplates()
    toast({ title: "Templates sincronizados", description: "Status atualizado via Meta API." })
  }

  const onCreateNew = () => {
    setEditing(undefined)
    setActiveTab("create")
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Modelos</h1>
            <p className="text-muted-foreground">Crie e gerencie templates de WhatsApp com preview e variáveis.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={loadTemplates} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button className="gap-2" onClick={onCreateNew}><PlusCircle className="w-4 h-4"/>Novo Modelo</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="create">Criar Modelo</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando templates...</p>
                </CardContent>
              </Card>
            ) : templates.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Nenhum modelo ainda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Clique em "Novo Modelo" para começar.</p>
                </CardContent>
              </Card>
            ) : (
              <TemplateList templates={templates} onEdit={onEdit} onSync={onSync} loadTemplates={loadTemplates} />
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-4 space-y-6">
            <TemplateBuilder key={editing?.id ?? "new"} onSave={onSave} initial={editing} />
            {editing && activeWorkspace && (
              <TemplateStatusDisplay 
                templateId={editing.id} 
                templateName={editing.name}
                workspaceId={activeWorkspace.id}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default Templates
