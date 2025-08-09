import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowRight, CheckCircle, Phone } from "lucide-react";

export function FailoverExample() {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Exemplo: Como funciona o Failover Sequencial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cenário */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h4 className="font-medium mb-2">📋 Cenário:</h4>
          <p className="text-sm">
            Campanha "Black Friday" com 10.000 contatos → Lista está sendo processada sequencialmente
          </p>
        </div>

        {/* Timeline do Failover */}
        <div className="space-y-4">
          {/* Situação 1: Normal */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-success/5">
            <div className="text-center">
              <div className="w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-xs mt-1">10:00</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+55 11 99999-0001</span>
                <Badge className="bg-success text-success-foreground">Green</Badge>
                <Badge variant="outline">Ativo</Badge>
              </div>
              <Progress value={30} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                Processando mensagens 1-3.000 da lista (30% completo)
              </p>
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto" />

          {/* Situação 2: Problema Detectado */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-warning/5">
            <div className="text-center">
              <div className="w-8 h-8 bg-warning text-warning-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-xs mt-1">10:15</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="font-medium">+55 11 99999-0001</span>
                <Badge className="bg-destructive text-destructive-foreground">Red</Badge>
                <Badge variant="outline">Degradado</Badge>
              </div>
              <div className="bg-warning/20 p-2 rounded text-sm">
                <p className="font-medium">⚠️ Quality dropped to RED</p>
                <p>Parou na mensagem: <strong>3.247</strong></p>
                <p>Failover automático ativado...</p>
              </div>
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto" />

          {/* Situação 3: Failover Executado */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-primary/5">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-xs mt-1">10:15</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="font-medium">+55 11 99999-0002</span>
                <Badge className="bg-success text-success-foreground">Green</Badge>
                <Badge className="bg-primary text-primary-foreground">Novo Ativo</Badge>
              </div>
              <Progress value={32} className="h-2 mb-2" />
              <div className="bg-primary/20 p-2 rounded text-sm">
                <p className="font-medium">✅ Failover realizado com sucesso</p>
                <p>Continuando da mensagem: <strong>3.248</strong></p>
                <p>Zero mensagens perdidas ou duplicadas</p>
              </div>
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto" />

          {/* Situação 4: Campanha Continua */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-success/5">
            <div className="text-center">
              <div className="w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <p className="text-xs mt-1">11:30</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="font-medium">+55 11 99999-0002</span>
                <Badge className="bg-success text-success-foreground">Green</Badge>
                <Badge variant="outline">Ativo</Badge>
              </div>
              <Progress value={85} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                Processando mensagens 3.248-8.500 normalmente (85% completo)
              </p>
            </div>
          </div>
        </div>

        {/* Garantias do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-success/10 p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <h4 className="font-medium text-success">Zero Perda</h4>
            <p className="text-xs text-muted-foreground">Nenhuma mensagem é perdida durante a troca</p>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-medium text-primary">Continuidade</h4>
            <p className="text-xs text-muted-foreground">Continua exatamente onde parou</p>
          </div>
          
          <div className="bg-warning/10 p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-warning mx-auto mb-2" />
            <h4 className="font-medium text-warning">Zero Duplicação</h4>
            <p className="text-xs text-muted-foreground">Contatos não recebem mensagens duplicadas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}