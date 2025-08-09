import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ErrorData {
  reason: string;
  count: number;
  percentage: number;
  color: string;
}

interface ErrorPanelProps {
  errors: ErrorData[];
  onViewSamples?: (reason: string) => void;
}

export function ErrorPanel({ errors, onViewSamples }: ErrorPanelProps) {
  const maxCount = Math.max(...errors.map(e => e.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 3 Motivos de Falha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.map((error, index) => (
          <div key={error.reason} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                <span className="text-sm font-medium">{error.reason}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {error.count} ({error.percentage}%)
                </span>
                {onViewSamples && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onViewSamples(error.reason)}
                    className="h-6 px-2 gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver amostras
                  </Button>
                )}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(error.count / maxCount) * 100}%`,
                  backgroundColor: error.color
                }}
              />
            </div>
          </div>
        ))}
        
        {errors.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma falha recente
          </div>
        )}
      </CardContent>
    </Card>
  );
}