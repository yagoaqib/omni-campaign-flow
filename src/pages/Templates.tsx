import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, PlusCircle } from "lucide-react"
import TemplateBuilder from "@/components/templates/TemplateBuilder"
import TemplateList from "@/components/templates/TemplateList"
import WABAStatusMatrix from "@/components/templates/WABAStatusMatrix"
import { TemplateModel, WABAStatus } from "@/components/templates/types"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

const Templates = () => {
  const [templates, setTemplates] = useLocalStorage<TemplateModel[]>("templates", [])
  const [activeTab, setActiveTab] = useState<string>("catalog")
  const [editing, setEditing] = useState<TemplateModel | undefined>(undefined)
  const { toast } = useToast()

  // SEO
  useEffect(() => {
    document.title = "Modelos WhatsApp – Builder e Catálogo"
    const metaDescId = "meta-templates-desc"
    let meta = document.head.querySelector(`#${metaDescId}`) as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement("meta")
      meta.id = metaDescId
      meta.name = "description"
      document.head.appendChild(meta)
    }
    meta.content = "Crie, edite e sincronize modelos de WhatsApp com preview, variáveis e mídia."

    const linkId = "canonical-templates"
    let link = document.head.querySelector(`#${linkId}`) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement("link")
      link.id = linkId
      link.rel = "canonical"
      document.head.appendChild(link)
    }
    link.href = window.location.href
  }, [])

  const onSave = (tpl: TemplateModel) => {
    setTemplates((prev) => {
      const exists = prev.some((p) => p.id === tpl.id)
      const next = exists ? prev.map((p) => (p.id === tpl.id ? tpl : p)) : [tpl, ...prev]
      return next
    })
    setEditing(tpl)
    setActiveTab("catalog")
    toast({ title: "Modelo salvo", description: `Modelo \"${tpl.name}\" salvo no catálogo.` })
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
            <Button variant="outline" className="gap-2" onClick={() => setTemplates([...templates])}>
              <RefreshCw className="w-4 h-4" /> Atualizar
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
            {templates.length === 0 ? (
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
