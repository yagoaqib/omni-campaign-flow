import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
}

interface FunnelCompactProps {
  data: FunnelData;
}

export function FunnelCompact({ data }: FunnelCompactProps) {
  const maxValue = data.sent;
  
  const getPercentage = (value: number) => (value / maxValue) * 100;
  const getRate = (value: number, base: number) => base > 0 ? ((value / base) * 100).toFixed(1) : "0.0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Funil de Entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enviadas */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enviadas</span>
            <span className="font-medium">{data.sent.toLocaleString()}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Entregues */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Entregues</span>
            <span className="font-medium">
              {data.delivered.toLocaleString()} ({getRate(data.delivered, data.sent)}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getPercentage(data.delivered)}%` }}
            />
          </div>
        </div>

        {/* Lidas */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Lidas</span>
            <span className="font-medium">
              {data.read.toLocaleString()} ({getRate(data.read, data.delivered)}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getPercentage(data.read)}%` }}
            />
          </div>
        </div>

        {/* Cliques */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Cliques</span>
            <span className="font-medium">
              {data.clicked.toLocaleString()} ({getRate(data.clicked, data.read)}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getPercentage(data.clicked)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}