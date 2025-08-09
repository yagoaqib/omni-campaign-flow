import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Pause, 
  Play, 
  Settings, 
  Activity,
  Phone,
  Smartphone,
  Zap,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

interface SenderProps {
  sender: {
    id: number;
    number: string;
    displayName: string;
    status: "healthy" | "degraded" | "paused";
    qualityRating: "Green" | "Yellow" | "Red";
    tier: {
      used: number;
      limit: number;
    };
    tps: {
      current: number;
      base: number;
    };
    provider: string;
    lastActivity: string;
    todayStats: {
      sent: number;
      delivered: number;
      failed: number;
    };
    weight: number;
  };
  onPause?: (id: number) => void;
  onResume?: (id: number) => void;
  onSettings?: (id: number) => void;
  onWeightChange?: (id: number, weight: number) => void;
  onTpsChange?: (id: number, tps: number) => void;
}

export function SenderCard({ sender, onPause, onResume, onSettings, onWeightChange, onTpsChange }: SenderProps) {
  const [weight, setWeight] = useState<number[]>([sender.weight]);
  const [baseTps, setBaseTps] = useState(sender.tps.base.toString());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-success";
      case "degraded": return "text-warning";
      case "paused": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Green": return "bg-success text-success-foreground";
      case "Yellow": return "bg-warning text-warning-foreground";
      case "Red": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-4 h-4" />;
      case "degraded": return <AlertTriangle className="w-4 h-4" />;
      case "paused": return <Pause className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const tierUsagePercentage = (sender.tier.used / sender.tier.limit) * 100;
  const deliveryRate = sender.todayStats.sent > 0 
    ? ((sender.todayStats.delivered / sender.todayStats.sent) * 100).toFixed(1) 
    : "0.0";

  const handleWeightChange = (value: number[]) => {
    setWeight(value);
    onWeightChange?.(sender.id, value[0]);
  };

  const handleTpsChange = (value: string) => {
    setBaseTps(value);
    const numValue = parseInt(value) || 0;
    onTpsChange?.(sender.id, numValue);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{sender.number}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {sender.provider}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getQualityColor(sender.qualityRating)}>
                  {sender.qualityRating}
                </Badge>
              </div>
            </div>

            {/* Display Name and Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{sender.displayName}</p>
                <div className={`flex items-center gap-1 text-sm ${getStatusColor(sender.status)}`}>
                  {getStatusIcon(sender.status)}
                  <span className="capitalize">{sender.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {sender.status === "paused" ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onResume?.(sender.id)}
                    className="gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Retomar
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onPause?.(sender.id)}
                    className="gap-1"
                  >
                    <Pause className="w-3 h-3" />
                    Pausar
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onSettings?.(sender.id)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tier Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tier Usage</span>
                <span>{sender.tier.used.toLocaleString()}/{sender.tier.limit.toLocaleString()}</span>
              </div>
              <Progress value={tierUsagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {tierUsagePercentage.toFixed(1)}% utilizado
              </p>
            </div>
          </div>

          {/* Right Column - Controls and Stats */}
          <div className="space-y-4">
            {/* Weight Control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Peso no rodízio</Label>
              <Slider
                value={weight}
                onValueChange={handleWeightChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-medium">{weight[0]}</span>
                <span>100</span>
              </div>
            </div>

            {/* TPS Control */}
            <div className="space-y-2">
              <Label htmlFor={`tps-${sender.id}`} className="text-sm font-medium">
                TPS base
              </Label>
              <Input
                id={`tps-${sender.id}`}
                type="number"
                value={baseTps}
                onChange={(e) => handleTpsChange(e.target.value)}
                className="h-8"
                min="1"
                max="100"
              />
            </div>

            {/* Current Stats */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  TPS atual:
                </span>
                <span className="font-medium">{sender.tps.current}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-medium">{sender.todayStats.sent.toLocaleString()}</p>
                  <p className="text-muted-foreground">Enviadas</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{sender.todayStats.delivered.toLocaleString()}</p>
                  <p className="text-muted-foreground">Entregues</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{sender.todayStats.failed.toLocaleString()}</p>
                  <p className="text-muted-foreground">Falhas</p>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span>Taxa de entrega:</span>
                <span className="font-medium">{deliveryRate}%</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Última atividade: {sender.lastActivity}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}