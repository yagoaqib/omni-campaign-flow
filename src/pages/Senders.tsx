import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Phone, Play, Pause, Settings, TrendingUp, AlertTriangle } from "lucide-react"

const Senders = () => {
  const senders = [
    {
      id: 1,
      number: "+55 11 9999-0001",
      displayName: "Atendimento Principal",
      status: "healthy",
      qualityRating: "Green",
      tier: { used: 8200, limit: 10000 },
      tps: { current: 15, max: 80 },
      provider: "Infobip",
      lastActivity: "2 min atrás",
      todayStats: {
        sent: 1247,
        delivered: 1235,
        failed: 12
      }
    },
    {
      id: 2,
      number: "+55 11 9999-0002", 
      displayName: "Marketing Campaigns",
      status: "degraded",
      qualityRating: "Yellow",
      tier: { used: 3100, limit: 5000 },
      tps: { current: 8, max: 50 },
      provider: "Infobip",
      lastActivity: "15 min atrás",
      todayStats: {
        sent: 892,
        delivered: 867,
        failed: 25
      }
    },
    {
      id: 3,
      number: "+55 11 9999-0003",
      displayName: "Suporte Técnico",
      status: "healthy", 
      qualityRating: "Green",
      tier: { used: 1800, limit: 10000 },
      tps: { current: 12, max: 80 },
      provider: "Gupshup",
      lastActivity: "5 min atrás",
      todayStats: {
        sent: 634,
        delivered: 628,
        failed: 6
      }
    },
    {
      id: 4,
      number: "+55 11 9999-0004",
      displayName: "E-commerce Alerts", 
      status: "paused",
      qualityRating: "Red",
      tier: { used: 4500, limit: 5000 },
      tps: { current: 0, max: 50 },
      provider: "Infobip",
      lastActivity: "2 horas atrás",
      todayStats: {
        sent: 0,
        delivered: 0,
        failed: 0
      }
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-success-soft text-success"
      case "degraded": return "bg-warning-soft text-warning"
      case "paused": return "bg-destructive-soft text-destructive"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Green": return "bg-success-soft text-success"
      case "Yellow": return "bg-warning-soft text-warning"
      case "Red": return "bg-destructive-soft text-destructive"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
      case "degraded": return <AlertTriangle className="w-4 h-4 text-warning" />
      case "paused": return <Pause className="w-4 h-4 text-destructive" />
      default: return <div className="w-2 h-2 bg-muted rounded-full"></div>
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Números & Senders</h1>
            <p className="text-muted-foreground">
              Monitore a saúde e performance dos seus números WhatsApp
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Phone className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-sm text-muted-foreground">Números Ativos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-sm text-muted-foreground">Qualidade Verde</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-warning rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-sm text-muted-foreground">Qualidade Amarela</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-success" />
                <div>
                  <div className="text-2xl font-bold">97.8%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Entrega Média</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Senders Grid */}
        <div className="grid gap-6">
          {senders.map((sender) => (
            <Card key={sender.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(sender.status)}
                      <CardTitle className="text-lg font-mono">{sender.number}</CardTitle>
                      <Badge variant="outline">{sender.provider}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{sender.displayName}</div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(sender.status)}>
                        {sender.status}
                      </Badge>
                      <Badge className={getQualityColor(sender.qualityRating)}>
                        Quality: {sender.qualityRating}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                    {sender.status === "paused" ? (
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        Reativar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Pause className="w-3 h-3" />
                        Pausar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tier Usage */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Tier Usage</span>
                    <span>{sender.tier.used.toLocaleString()} / {sender.tier.limit.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(sender.tier.used / sender.tier.limit) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {Math.round((sender.tier.used / sender.tier.limit) * 100)}% utilizado
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold">{sender.tps.current}</div>
                    <div className="text-xs text-muted-foreground">TPS Atual</div>
                    <div className="text-xs text-muted-foreground">max: {sender.tps.max}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{sender.todayStats.sent}</div>
                    <div className="text-xs text-muted-foreground">Enviadas Hoje</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-success">{sender.todayStats.delivered}</div>
                    <div className="text-xs text-muted-foreground">Entregues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-destructive">{sender.todayStats.failed}</div>
                    <div className="text-xs text-muted-foreground">Falhas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {sender.todayStats.sent > 0 
                        ? Math.round((sender.todayStats.delivered / sender.todayStats.sent) * 100) 
                        : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Taxa de Entrega</div>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  Última atividade: {sender.lastActivity}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export default Senders