import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowDown, 
  ArrowUp, 
  Move3D, 
  Play, 
  AlertTriangle, 
  CheckCircle,
  Phone,
  Smartphone
} from "lucide-react";
import { useEffect, useState } from "react";

interface FailoverSequenceProps {
  poolId: string;
  onOrderChange?: (newOrder: number[]) => void;
  selectedIds?: number[];
}

interface WABAInSequence {
  id: number;
  number: string;
  displayName: string;
  quality: "Green" | "Yellow" | "Red";
  status: "healthy" | "degraded" | "paused";
  tier: {
    used: number;
    limit: number;
  };
  currentCampaigns: string[];
  lastFailover?: {
    from: string;
    reason: string;
    continueFrom: number; // posição na lista onde vai continuar
  };
}

const mockWABAs: WABAInSequence[] = [
  {
    id: 1,
    number: "+55 11 99999-0001",
    displayName: "WABA Principal",
    quality: "Green",
    status: "healthy",
    tier: { used: 3200, limit: 10000 },
    currentCampaigns: ["Black Friday", "Boas Vindas"],
  },
  {
    id: 2,
    number: "+55 11 99999-0002", 
    displayName: "WABA Backup",
    quality: "Yellow",
    status: "degraded",
    tier: { used: 1800, limit: 5000 },
    currentCampaigns: [],
    lastFailover: {
      from: "+55 11 99999-0001",
      reason: "Quality Red - auto switch",
      continueFrom: 1247 // continuou da mensagem 1247 da lista
    }
  },
  {
    id: 3,
    number: "+55 11 99999-0003",
    displayName: "WABA Reserva",
    quality: "Green", 
    status: "healthy",
    tier: { used: 450, limit: 10000 },
    currentCampaigns: [],
  },
];

export function FailoverSequence({ poolId, onOrderChange, selectedIds }: FailoverSequenceProps) {
  const [sequence, setSequence] = useState<WABAInSequence[]>(
    selectedIds && selectedIds.length
      ? mockWABAs.filter(w => selectedIds.includes(w.id))
      : mockWABAs
  );

  useEffect(() => {
    if (!selectedIds) return;
    const filtered = mockWABAs.filter(w => selectedIds.includes(w.id));
    setSequence(filtered);
  }, [selectedIds]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSequence = [...sequence];
    [newSequence[index], newSequence[index - 1]] = [newSequence[index - 1], newSequence[index]];
    setSequence(newSequence);
    onOrderChange?.(newSequence.map(w => w.id));
  };

  const moveDown = (index: number) => {
    if (index === sequence.length - 1) return;
    const newSequence = [...sequence];
    [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
    setSequence(newSequence);
    onOrderChange?.(newSequence.map(w => w.id));
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
      case "healthy": return <CheckCircle className="w-4 h-4 text-success" />;
      case "degraded": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "paused": return <Phone className="w-4 h-4 text-muted-foreground" />;
      default: return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move3D className="w-5 h-5" />
          Sequência de Failover
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ordem de substituição automática dos números. O primeiro da lista é sempre o preferencial.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sequence.map((waba, index) => {
          const tierPercentage = (waba.tier.used / waba.tier.limit) * 100;
          
          return (
            <div key={waba.id} className="relative">
              {/* Ordem visual */}
              <div className="absolute -left-3 top-3 z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
              </div>

              <Card className={`ml-4 ${index === 0 ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Info do WABA */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(waba.status)}
                        <div>
                          <p className="font-medium">{waba.number}</p>
                          <p className="text-sm text-muted-foreground">{waba.displayName}</p>
                        </div>
                        <Badge className={getQualityColor(waba.quality)}>
                          {waba.quality}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="default" className="gap-1">
                            <Play className="w-3 h-3" />
                            Ativo
                          </Badge>
                        )}
                      </div>

                      {/* Tier Usage */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Tier: {waba.tier.used.toLocaleString()}/{waba.tier.limit.toLocaleString()}</span>
                          <span>{tierPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={tierPercentage} className="h-1" />
                      </div>

                      {/* Campanhas Ativas */}
                      {waba.currentCampaigns.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Campanhas ativas:</p>
                          <div className="flex gap-1 flex-wrap">
                            {waba.currentCampaigns.map((campaign) => (
                              <Badge key={campaign} variant="outline" className="text-xs">
                                {campaign}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Info de Failover */}
                      {waba.lastFailover && (
                        <div className="bg-muted/50 p-2 rounded text-xs">
                          <p className="font-medium text-warning">
                            ⚠️ Failover ativo
                          </p>
                          <p>De: {waba.lastFailover.from}</p>
                          <p>Motivo: {waba.lastFailover.reason}</p>
                          <p className="font-medium">
                            Continuando da mensagem #{waba.lastFailover.continueFrom.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Controles de Ordem */}
                    <div className="flex flex-col gap-1 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === sequence.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seta indicando fluxo */}
              {index < sequence.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}

        {/* Explicação do Sistema */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mt-6">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            Como funciona o Failover Sequencial:
          </h4>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
            <li>• <strong>Ordem importa:</strong> O sistema sempre tenta usar o número no topo da lista</li>
            <li>• <strong>Continuidade garantida:</strong> Se o WABA-01 parou na mensagem 1.247, o WABA-02 continua da 1.248</li>
            <li>• <strong>Auto-switch inteligente:</strong> Troca automaticamente por Quality Red, Tier 90%, ou 429 burst</li>
            <li>• <strong>Recuperação automática:</strong> Quando o número principal se recupera, ele volta a ser preferencial</li>
            <li>• <strong>Zero perda:</strong> Nenhuma mensagem é perdida ou duplicada durante a troca</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}