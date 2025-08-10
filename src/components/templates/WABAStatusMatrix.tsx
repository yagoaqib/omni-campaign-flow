import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TemplateModel, WABAStatus, defaultWABAs } from "./types"

function statusColor(s: WABAStatus["status"]) {
  switch (s) {
    case "APPROVED":
      return "bg-success-soft text-success"
    case "PENDING":
      return "bg-warning-soft text-warning"
    case "REJECTED":
      return "bg-destructive-soft text-destructive"
    case "NOT_SUBMITTED":
    default:
      return "bg-muted text-muted-foreground"
  }
}

interface Props {
  template: TemplateModel
  onSimulateSync: (next: WABAStatus[]) => void
}

export default function WABAStatusMatrix({ template, onSimulateSync }: Props) {
  const statuses = React.useMemo(() => {
    const map = new Map(template.wabaStatuses.map((s) => [s.wabaId, s]))
    return defaultWABAs.map((w) =>
      map.get(w.wabaId) ?? {
        wabaId: w.wabaId,
        phoneName: w.phoneName,
        status: "NOT_SUBMITTED" as const,
      }
    )
  }, [template.wabaStatuses])

  const simulate = () => {
    // Randomly set to pending/approved to emulate sync
    const next: WABAStatus[] = statuses.map((s) => {
      if (s.status === "APPROVED") return s
      const r = Math.random()
      const status: WABAStatus["status"] = r > 0.7 ? "REJECTED" : r > 0.3 ? "PENDING" : "APPROVED"
      return { ...s, status, lastSyncAt: new Date().toISOString() }
    })
    onSimulateSync(next)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Status por WABA</CardTitle>
          <Button variant="outline" onClick={simulate}>Sincronizar (simulado)</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {statuses.map((s) => (
          <div key={s.wabaId} className="flex items-center justify-between rounded-md border p-3">
            <div className="font-medium">{s.phoneName}</div>
            <div className="flex items-center gap-3">
              <Badge className={statusColor(s.status)}>{s.status}</Badge>
              {s.lastSyncAt && (
                <span className="text-xs text-muted-foreground">{new Date(s.lastSyncAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}
        <Separator />
        <div className="text-xs text-muted-foreground">
          <strong>Informação automática:</strong> Status por WABA é sincronizado automaticamente pela Meta Graph API. Não precisa ser preenchido manualmente.
        </div>
      </CardContent>
    </Card>
  )
}
