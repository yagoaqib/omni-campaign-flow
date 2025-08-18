import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import MessageRateGauge from "./MessageRateGauge";
import { useAvailableNumbers, type AvailableNumber } from "@/hooks/useAvailableNumbers";

interface NumberPerformance {
  id: string;
  label: string;
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'PAUSED' | 'BLOCKED';
  displayNumber: string;
  mpsTarget: number;
  messagesPerSecond: number;
  totalSent: number;
  lastUpdated: string;
}

export default function NumbersPerformancePanel() {
  const { numbers: availableNumbers } = useAvailableNumbers();
  const [performances, setPerformances] = React.useState<NumberPerformance[]>([]);
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  // Simulate real-time data updates
  React.useEffect(() => {
    if (!isMonitoring) {
      setPerformances([]);
      return;
    }

    // Initialize with available numbers
    const initPerformances = availableNumbers.map(num => ({
      ...num,
      messagesPerSecond: 0,
      totalSent: 0,
      lastUpdated: new Date().toISOString()
    }));
    setPerformances(initPerformances);

    // Simulate message rate updates
    const interval = setInterval(() => {
      setPerformances(prev => prev.map(perf => {
        const baseRate = perf.quality === "HIGH" ? 8 : perf.quality === "MEDIUM" ? 5 : 2;
        const variance = Math.random() * 2 - 1; // -1 to +1
        const newRate = Math.max(0, baseRate + variance + (Math.random() * 3));
        
        return {
          ...perf,
          messagesPerSecond: perf.status === "ACTIVE" ? newRate : 0,
          totalSent: perf.totalSent + (perf.status === "ACTIVE" ? newRate : 0),
          lastUpdated: new Date().toISOString()
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const totalRate = performances.reduce((sum, p) => sum + p.messagesPerSecond, 0);
  const activeNumbers = performances.filter(p => p.status === "ACTIVE").length;
  const bestPerformer = performances.reduce((best, current) => 
    current.messagesPerSecond > best.messagesPerSecond ? current : best, 
    performances[0] || { messagesPerSecond: 0, label: "N/A" }
  );

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Monitor de Performance em Tempo Real
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Acompanhe mensagens por segundo de cada número para otimizar disparos em volume
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-center pb-4">
            <Button 
              onClick={toggleMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isMonitoring ? "animate-spin" : ""}`} />
              {isMonitoring ? "Parar monitoramento" : "Iniciar monitoramento"}
            </Button>
          </div>

          {isMonitoring && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Rate */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalRate.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total msg/s
                  </div>
                </div>
              </div>
              
              {/* Active Numbers */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5">
                <Zap className="w-8 h-8 text-success" />
                <div>
                  <div className="text-2xl font-bold text-success">
                    {activeNumbers}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Números ativos
                  </div>
                </div>
              </div>
              
              {/* Best Performer */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5">
                <AlertTriangle className="w-8 h-8 text-warning" />
                <div>
                  <div className="text-lg font-bold text-warning truncate">
                    {bestPerformer?.label || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Melhor performance
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isMonitoring && (
            <div className="text-center text-sm text-muted-foreground py-6">
              Monitor desativado. Inicie o monitoramento para ver as métricas em tempo real.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Gauges */}
      {isMonitoring && performances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {performances.map((perf) => (
            <MessageRateGauge
              key={perf.id}
              numberLabel={perf.label}
              messagesPerSecond={perf.messagesPerSecond}
              quality={perf.quality}
              status={perf.status}
              maxRate={10}
            />
          ))}
        </div>
      )}
      
    </div>
  );
}