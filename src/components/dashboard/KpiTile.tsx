import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiTileProps {
  title: string;
  value: string;
  delta?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  onClick?: () => void;
}

export function KpiTile({ title, value, delta, onClick }: KpiTileProps) {
  const isClickable = !!onClick;
  
  return (
    <Card className={`${isClickable ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{value}</p>
            {delta && (
              <Badge variant={delta.trend === "up" ? "default" : delta.trend === "down" ? "destructive" : "secondary"} className="gap-1">
                {delta.trend === "up" && <TrendingUp className="w-3 h-3" />}
                {delta.trend === "down" && <TrendingDown className="w-3 h-3" />}
                {delta.value}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}