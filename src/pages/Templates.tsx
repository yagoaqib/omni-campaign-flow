import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, PlusCircle } from "lucide-react"
import TemplateBuilder from "@/components/templates/TemplateBuilder"
import TemplateList from "@/components/templates/TemplateList"
import WABAStatusMatrix from "@/components/templates/WABAStatusMatrix"
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
        .from("templates")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Convert Supabase data to TemplateModel format
      const convertedTemplates: TemplateModel[] = data.map(template => ({
        id: template.id,
        name: template.name,
        language: template.language,
        category: template.category as any,
        headerType: "NONE" as any, // This should be extracted from components_schema
        body: "", // This should be extracted from components_schema  
        footer: "", // This should be extracted from components_schema
        buttons: [], // This should be extracted from components_schema
        createdAt: template.created_at,
        updatedAt: template.created_at,
        wabaStatuses: []
      }))
      
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
      // Save to Supabase
      const { error } = await supabase
        .from("templates")
        .upsert({
          id: tpl.id,
          name: tpl.name,
          language: tpl.language,
          category: tpl.category,
          components_schema: {
            header: { type: tpl.headerType, text: tpl.headerText },
            body: { text: tpl.body },
            footer: tpl.footer ? { text: tpl.footer } : null,
            buttons: tpl.buttons.map(btn => ({
              id: btn.id,
              type: btn.type,
              text: btn.text,
              url: btn.url || null,
              phone: btn.phone || null
            }))
          } as any,
          workspace_id: activeWorkspace.id,
          waba_ref: "", // Will be set properly later
          status: "DRAFT"
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

  const updateStatuses = (next: WABAStatus[]) => {
    if (!editing) return
    const updated: TemplateModel = { ...editing, wabaStatuses: next, updatedAt: new Date().toISOString() }
    setEditing(updated)
    setTemplates((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    toast({ title: "Catálogo sincronizado (simulado)", description: "Status por WABA atualizado." })
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
              <TemplateList templates={templates} onEdit={onEdit} onSync={onSync} />
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-4 space-y-6">
            <TemplateBuilder key={editing?.id ?? "new"} onSave={onSave} initial={editing} />
            {editing && (
              <WABAStatusMatrix template={editing} onSimulateSync={updateStatuses} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default Templates
