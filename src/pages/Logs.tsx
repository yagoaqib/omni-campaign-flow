import { useCallback, useEffect, useMemo, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, Search } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useWorkspace } from "@/hooks/useWorkspace"

interface WebhookEvent {
  id: string
  created_at: string
  event_type: string
  related_dispatch_job_id: string | null
  payload: Record<string, any>
}

interface AppLog {
  id: string
  created_at: string
  type: string
  title: string
  message: string
  metadata: Record<string, any> | null
}

const Logs = () => {
  const { activeWorkspace } = useWorkspace()
  const [tab, setTab] = useState("webhooks")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([])
  const [appLogs, setAppLogs] = useState<AppLog[]>([])

  // SEO
  useEffect(() => {
    document.title = "Logs de Webhooks e Aplicação | Console"
    const descText = "Acompanhe eventos de webhooks e logs da aplicação em tempo real."
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "description"
      document.head.appendChild(meta)
    }
    meta.content = descText

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}/logs`
  }, [])

  const loadData = useCallback(async () => {
    if (!activeWorkspace?.id) return
    setLoading(true)
    try {
      const [whRes, appRes] = await Promise.all([
        supabase
          .from("webhook_events")
          .select("id, created_at, event_type, related_dispatch_job_id, payload")
          .eq("workspace_id", activeWorkspace.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("notifications")
          .select("id, created_at, type, title, message, metadata")
          .eq("workspace_id", activeWorkspace.id)
          .order("created_at", { ascending: false })
          .limit(200),
      ])

      if (whRes.data) setWebhooks(whRes.data as unknown as WebhookEvent[])
      if (appRes.data) setAppLogs(appRes.data as unknown as AppLog[])
    } finally {
      setLoading(false)
    }
  }, [activeWorkspace?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscriptions
  useEffect(() => {
    if (!activeWorkspace?.id) return

    const chWh = supabase
      .channel("realtime:webhook_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "webhook_events" },
        (payload: any) => {
          const row = payload.new as WebhookEvent & { workspace_id?: string }
          if ((row as any).workspace_id === activeWorkspace.id) {
            setWebhooks((prev) => [row, ...prev].slice(0, 300))
          }
        }
      )
      .subscribe()

    const chApp = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => {
          const row = payload.new as AppLog & { workspace_id?: string }
          if ((row as any).workspace_id === activeWorkspace.id) {
            setAppLogs((prev) => [row, ...prev].slice(0, 300))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chWh)
      supabase.removeChannel(chApp)
    }
  }, [activeWorkspace?.id])

  const filteredWebhooks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return webhooks
    return webhooks.filter((e) => {
      const base = `${e.event_type} ${e.related_dispatch_job_id ?? ""}`.toLowerCase()
      const payloadStr = JSON.stringify(e.payload || {}).toLowerCase()
      return base.includes(q) || payloadStr.includes(q)
    })
  }, [search, webhooks])

  const filteredAppLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return appLogs
    return appLogs.filter((e) => {
      return (
        e.type.toLowerCase().includes(q) ||
        (e.title || "").toLowerCase().includes(q) ||
        (e.message || "").toLowerCase().includes(q) ||
        JSON.stringify(e.metadata || {}).toLowerCase().includes(q)
      )
    })
  }, [search, appLogs])

  const JsonPreview = ({ value }: { value: any }) => (
    <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground bg-secondary/30 rounded p-3 overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs</h1>
            <p className="text-muted-foreground">Logs de aplicação e webhooks em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar por tipo, título, mensagem ou payload"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                aria-label="Filtrar logs"
              />
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </header>

        <main>
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="app">Aplicação</TabsTrigger>
            </TabsList>

            <TabsContent value="webhooks">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Eventos de Webhook</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[520px] pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Dispatch Job</TableHead>
                          <TableHead>Payload</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWebhooks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              {loading ? "Carregando..." : "Nenhum evento encontrado"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredWebhooks.map((e) => (
                            <TableRow key={e.id} className="align-top">
                              <TableCell className="whitespace-nowrap">
                                {new Date(e.created_at).toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{e.event_type}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {e.related_dispatch_job_id ?? "—"}
                              </TableCell>
                              <TableCell>
                                <JsonPreview value={e.payload} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="app">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logs da Aplicação</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[520px] pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Mensagem</TableHead>
                          <TableHead>Metadados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {loading ? "Carregando..." : "Nenhum log encontrado"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAppLogs.map((e) => (
                            <TableRow key={e.id} className="align-top">
                              <TableCell className="whitespace-nowrap">
                                {new Date(e.created_at).toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{e.type}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{e.title}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{e.message}</TableCell>
                              <TableCell>
                                <JsonPreview value={e.metadata} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  )
}

export default Logs