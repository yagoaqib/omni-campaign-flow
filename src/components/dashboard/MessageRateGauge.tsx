import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  numberLabel: string;
  messagesPerSecond: number;
  quality: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  maxRate?: number;
}

export default function MessageRateGauge({ 
  numberLabel, 
  messagesPerSecond, 
  quality, 
  status,
  maxRate = 10 
}: Props) {
  const percentage = Math.min((messagesPerSecond / maxRate) * 100, 100);
  const angle = (percentage / 100) * 180; // 180 degrees for half circle
  
  const getQualityColor = () => {
    switch (quality) {
      case "HIGH": return "text-success";
      case "MEDIUM": return "text-warning";
      case "LOW": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "ACTIVE": return "bg-success-soft text-success";
      case "PAUSED": return "bg-warning-soft text-warning";
      case "BLOCKED": return "bg-destructive-soft text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRateColor = () => {
    if (messagesPerSecond >= maxRate * 0.8) return "text-success";
    if (messagesPerSecond >= maxRate * 0.5) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{numberLabel}</CardTitle>
          <Badge className={getStatusColor()}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center space-y-2">
          {/* Gauge Visual */}
          <div className="relative w-24 h-12">
            <svg viewBox="0 0 120 60" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 50 A 50 50 0 0 1 110 50"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <path
                d="M 10 50 A 50 50 0 0 1 110 50"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 157} 157`}
                className="transition-all duration-500 ease-out"
              />
              {/* Needle */}
              <g transform={`translate(60, 50) rotate(${angle - 90})`}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-35"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="3"
                  fill="hsl(var(--foreground))"
                />
              </g>
            </svg>
          </div>
          
          {/* Rate Display */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${getRateColor()}`}>
              {messagesPerSecond.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">msg/s</div>
          </div>
          
          {/* Quality Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Qualidade:</span>
            <span className={`font-medium ${getQualityColor()}`}>{quality}</span>
          </div>
          
          {/* Max Rate Reference */}
          <div className="text-xs text-muted-foreground">
            Máx: {maxRate} msg/s
          </div>
        </div>
      </CardContent>
    </Card>
  );
}