import { AppLayout } from "@/components/layout/AppLayout";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { FunnelCompact } from "@/components/dashboard/FunnelCompact";
import { SingleLineChart } from "@/components/dashboard/SingleLineChart";


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

      </div>
    </AppLayout>
  );
}

export default Index;
