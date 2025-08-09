import { AppLayout } from "@/components/layout/AppLayout";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { FunnelCompact } from "@/components/dashboard/FunnelCompact";
import { SingleLineChart } from "@/components/dashboard/SingleLineChart";
import { ErrorPanel } from "@/components/dashboard/ErrorPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Cloud, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample data
const funnelData = {
  sent: 24500,
  delivered: 23098,
  read: 19234,
  clicked: 1847
};

const chartData = [
  { time: "00:00", delivered: 1200, read: 950 },
  { time: "04:00", delivered: 800, read: 640 },
  { time: "08:00", delivered: 2400, read: 1920 },
  { time: "12:00", delivered: 3200, read: 2560 },
  { time: "16:00", delivered: 2800, read: 2240 },
  { time: "20:00", delivered: 1600, read: 1280 },
];

const errorData = [
  { reason: "Rate limit exceeded", count: 145, percentage: 45.2, color: "#EF4444" },
  { reason: "Undeliverable", count: 98, percentage: 30.5, color: "#F59E0B" },
  { reason: "Template mismatch", count: 78, percentage: 24.3, color: "#6B7280" },
];

const recentAlerts = [
  { id: 1, type: "quality", message: "Quality drop em WABA-01", time: "2 min", severity: "warning" },
  { id: 2, type: "tier", message: "Tier 90% atingido WABA-02", time: "5 min", severity: "error" },
  { id: 3, type: "429", message: "429 burst detectado", time: "8 min", severity: "error" },
  { id: 4, type: "template", message: "Template sync pendente", time: "12 min", severity: "info" },
];

function Index() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral de saúde do canal WhatsApp
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select defaultValue="24h">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Meta Cloud</span>
              <Badge variant="outline">WABA-01</Badge>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            title="Enviadas"
            value="24.5K"
            delta={{ value: "+12.5%", trend: "up" }}
            onClick={() => navigate("/reports")}
          />
          <KpiTile
            title="Entregues"
            value="23.1K"
            delta={{ value: "+8.2%", trend: "up" }}
            onClick={() => navigate("/reports")}
          />
          <KpiTile
            title="Lidas"
            value="19.2K"
            delta={{ value: "-1.3%", trend: "down" }}
            onClick={() => navigate("/reports")}
          />
          <KpiTile
            title="CTR"
            value="3.4%"
            delta={{ value: "+0.8%", trend: "up" }}
            onClick={() => navigate("/reports")}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelCompact data={funnelData} />
          <SingleLineChart data={chartData} />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorPanel 
            errors={errorData} 
            onViewSamples={(reason) => console.log("View samples for:", reason)} 
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'error' ? 'bg-destructive' : 
                    alert.severity === 'warning' ? 'bg-warning' : 'bg-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
              
              {recentAlerts.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum alerta recente
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default Index;
