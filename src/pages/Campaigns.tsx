import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Pause, Copy, BarChart3, Download } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect } from "react"


const Campaigns = () => {
  useEffect(() => { document.title = "Campanhas | Console" }, [])
  const campaigns = [
    {
      id: 1,
      name: "Black Friday 2024",
      type: "Template",
      provider: "Infobip",
      status: "Running",
      progress: 85,
      sent: 8234,
      delivered: 8104,
      seen: 7456,
      failed: 130
    },
    {
      id: 2,
      name: "Welcome Series",
      type: "Sessão",
      provider: "Gupshup", 
      status: "Running",
      progress: 92,
      sent: 2847,
      delivered: 2785,
      seen: 2534,
      failed: 62
    },
    {
      id: 3,
      name: "Cart Recovery",
      type: "Template",
      provider: "Infobip",
      status: "Paused",
      progress: 45,
      sent: 1234,
      delivered: 1198,
      seen: 1089,
      failed: 36
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running": return "bg-success-soft text-success"
      case "Paused": return "bg-warning-soft text-warning"
      case "Completed": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Gerencie suas campanhas de WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/campaigns/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Campanha
              </Button>
            </Link>
            <Link to="/campaigns/new?type=farm">
              <Button variant="secondary" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Farm
              </Button>
            </Link>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      <Badge variant="outline">{campaign.type}</Badge>
                      <Badge variant="secondary">{campaign.provider}</Badge>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                    {campaign.status === "Running" ? (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Pause className="w-3 h-3" />
                        Pausar
                      </Button>
                    ) : (
                      <Button size="sm" className="gap-1">
                        <Play className="w-3 h-3" />
                        Retomar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{campaign.sent.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Enviadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{campaign.delivered.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Entregues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{campaign.seen.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Lidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">{campaign.failed}</div>
                    <div className="text-sm text-muted-foreground">Falhas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export default Campaigns