import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";

interface ChartData {
  time: string;
  delivered: number;
  read: number;
}

interface SingleLineChartProps {
  data: ChartData[];
}

export function SingleLineChart({ data }: SingleLineChartProps) {
  const [activeMetric, setActiveMetric] = useState<'delivered' | 'read'>('delivered');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tendência</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={activeMetric === 'delivered' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveMetric('delivered')}
            >
              Entregues
            </Button>
            <Button 
              variant={activeMetric === 'read' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveMetric('read')}
            >
              Lidas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <Tooltip 
                labelClassName="text-foreground"
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={activeMetric} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}