import { AppLayout } from "@/components/layout/AppLayout"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { LiveFeed } from "@/components/dashboard/LiveFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  CheckCircle, 
  Eye, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  Zap,
  Play,
  Pause
} from "lucide-react"

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral das suas campanhas em tempo real
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm">
              <Play className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Mensagens Enviadas"
            value="12,485"
            change={{ value: "+12%", type: "increase" }}
            icon={MessageSquare}
            description="Últimas 24h"
          />
          <MetricCard
            title="Taxa de Entrega"
            value="98.7%"
            change={{ value: "+0.3%", type: "increase" }}
            icon={CheckCircle}
            variant="success"
            description="Média mensal"
          />
          <MetricCard
            title="Taxa de Leitura"
            value="87.2%"
            change={{ value: "-1.2%", type: "decrease" }}
            icon={Eye}
            description="Últimos 7 dias"
          />
          <MetricCard
            title="Falhas"
            value="158"
            change={{ value: "+5", type: "decrease" }}
            icon={AlertTriangle}
            variant="warning"
            description="Últimas 24h"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Activity Feed */}
          <LiveFeed />

          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Campanhas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: "Black Friday 2024",
                  status: "running",
                  sent: "8,234",
                  remaining: "1,766",
                  provider: "Infobip"
                },
                {
                  name: "Welcome Series",
                  status: "running", 
                  sent: "2,847",
                  remaining: "453",
                  provider: "Gupshup"
                },
                {
                  name: "Cart Recovery",
                  status: "paused",
                  sent: "1,234",
                  remaining: "2,100",
                  provider: "Infobip"
                }
              ].map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campaign.name}</span>
                      <Badge 
                        variant="secondary"
                        className={
                          campaign.status === "running" 
                            ? "bg-success-soft text-success" 
                            : "bg-warning-soft text-warning"
                        }
                      >
                        {campaign.status === "running" ? (
                          <><Play className="w-3 h-3 mr-1" /> Ativa</>
                        ) : (
                          <><Pause className="w-3 h-3 mr-1" /> Pausada</>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.sent} enviadas • {campaign.remaining} restantes • {campaign.provider}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver detalhes
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance por Provedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="font-medium">Infobip</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">98.9%</div>
                  <div className="text-sm text-muted-foreground">7,845 msgs</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span className="font-medium">Gupshup</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">97.2%</div>
                  <div className="text-sm text-muted-foreground">4,640 msgs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Números Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { number: "+55 11 9999-0001", quality: "Green", tier: "8.2k/10k" },
                { number: "+55 11 9999-0002", quality: "Yellow", tier: "3.1k/5k" },
                { number: "+55 11 9999-0003", quality: "Green", tier: "1.8k/10k" }
              ].map((sender, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{sender.number}</div>
                    <div className="text-xs text-muted-foreground">{sender.tier}</div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      sender.quality === "Green" 
                        ? "bg-success-soft text-success" 
                        : "bg-warning-soft text-warning"
                    }
                  >
                    {sender.quality}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 p-3 bg-warning-soft rounded-lg">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Rate limit detectado</div>
                  <div className="text-xs text-muted-foreground">
                    Número +55 11 9999-0002 - há 5 min
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Campanha finalizada</div>
                  <div className="text-xs text-muted-foreground">
                    Newsletter Dezembro - 98.5% entrega
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
