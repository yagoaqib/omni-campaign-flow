import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, RefreshCw, Edit3 } from "lucide-react"
import { TemplateModel } from "./types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAvailableNumbers } from "@/hooks/useAvailableNumbers"

interface Props {
  templates: TemplateModel[]
  onEdit: (tpl: TemplateModel) => void
  onSync: (tpl: TemplateModel) => void
}

function getStatusTag(t: TemplateModel) {
  const hasApproved = t.wabaStatuses.some((s) => s.status === "APPROVED")
  const allApproved = t.wabaStatuses.length > 0 && t.wabaStatuses.every((s) => s.status === "APPROVED")
  if (allApproved) return <Badge className="bg-success-soft text-success">Sincronizado</Badge>
  if (hasApproved) return <Badge className="bg-warning-soft text-warning">Parcial</Badge>
  return <Badge variant="outline">Rascunho</Badge>
}

export default function TemplateList({ templates, onEdit, onSync }: Props) {
  const { numbers: phoneNumbers, loading } = useAvailableNumbers()
  const [filterId, setFilterId] = React.useState<string>("all")
  const getNumberLabel = (id?: string) => phoneNumbers.find((n) => n.id === id)?.label ?? "—"
  const list = React.useMemo(
    () => templates.filter((t) => (filterId === "all" ? true : t.assignedNumberId === filterId)),
    [templates, filterId]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Filtrar por Número/WABA</div>
        <Select value={filterId} onValueChange={setFilterId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {phoneNumbers.map((n) => (
              <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {list.map((t) => (
          <Card key={t.id} className="hover:shadow-soft transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-mono">{t.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t.language}</Badge>
                    <Badge variant="secondary">{t.category}</Badge>
                    {t.assignedNumberId && (
                      <Badge variant="outline">Número: {getNumberLabel(t.assignedNumberId)}</Badge>
                    )}
                    {getStatusTag(t)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(t)} title="Editar"><Edit3 className="w-4 h-4"/></Button>
                  <Button variant="ghost" size="icon" onClick={() => onSync(t)} title="Sincronizar"><RefreshCw className="w-4 h-4"/></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Criado</div>
                  <div>{new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Atualizado</div>
                  <div>{new Date(t.updatedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Botões</div>
                  <div>{t.buttons.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status por WABA</div>
                  <div>
                    {t.wabaStatuses.slice(0, 3).map((s) => (
                      <Badge key={s.wabaId} className="mr-1 mt-1">{s.status}</Badge>
                    ))}
                    {t.wabaStatuses.length > 3 && <span className="text-xs text-muted-foreground">+{t.wabaStatuses.length - 3}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
