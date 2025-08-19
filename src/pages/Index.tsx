import { AppLayout } from "@/components/layout/AppLayout";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { FunnelCompact } from "@/components/dashboard/FunnelCompact";
import { SingleLineChart } from "@/components/dashboard/SingleLineChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Cloud, Smartphone, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealTimeMetrics } from "@/hooks/useRealTimeMetrics";
import { useReportsData } from "@/hooks/useReportsData";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";


function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { metrics, loading: metricsLoading, refreshMetrics } = useRealTimeMetrics();
  const { hourlyStats, loading: reportsLoading } = useReportsData();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("User authenticated:", user?.email);
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  // Prepare funnel data from real metrics
  const funnelData = {
    sent: metrics.messages.sent,
    delivered: metrics.messages.delivered,
    read: metrics.messages.read,
    clicked: 0 // No click tracking implemented yet
  };

  // Use real hourly stats or empty array
  const chartData = hourlyStats.length > 0 ? hourlyStats.map(stat => ({
    time: stat.hour,
    delivered: stat.delivered,
    read: stat.read
  })) : [];

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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
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
              <Badge variant="outline">
                {metrics.numbers.active > 0 ? `${metrics.numbers.active} ativos` : 'Sem números'}
              </Badge>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            title="Enviadas"
            value={metricsLoading ? "..." : metrics.messages.sent.toLocaleString()}
            delta={{ value: metrics.messages.sent > 0 ? "Dados reais" : "Sem dados", trend: "neutral" }}
            onClick={() => navigate("/reports")}
          />
          <KpiTile
            title="Entregues"
            value={metricsLoading ? "..." : metrics.messages.delivered.toLocaleString()}
            delta={{ 
              value: `${metrics.messages.deliveryRate.toFixed(1)}%`, 
              trend: metrics.messages.deliveryRate >= 95 ? "up" : metrics.messages.deliveryRate >= 90 ? "neutral" : "down" 
            }}
            onClick={() => navigate("/reports")}
          />
          <KpiTile
            title="Lidas"
            value={metricsLoading ? "..." : metrics.messages.read.toLocaleString()}
            delta={{ 
              value: `${metrics.messages.readRate.toFixed(1)}%`, 
              trend: metrics.messages.readRate >= 70 ? "up" : metrics.messages.readRate >= 50 ? "neutral" : "down"
            }}
            onClick={() => navigate("/reports")}
          />
          <KpiTile
            title="Números Ativos"
            value={metricsLoading ? "..." : metrics.numbers.active.toString()}
            delta={{ 
              value: `${metrics.numbers.high_quality} qualidade alta`, 
              trend: metrics.numbers.high_quality > 0 ? "up" : "down" 
            }}
            onClick={() => navigate("/senders")}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metricsLoading || reportsLoading ? (
            <div className="lg:col-span-2 flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Carregando métricas reais...</p>
              </div>
            </div>
          ) : (
            <>
              <FunnelCompact data={funnelData} />
              <SingleLineChart data={chartData} />
            </>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

export default Index;
