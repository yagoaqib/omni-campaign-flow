import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Phone, Users, RotateCcw } from "lucide-react";

export function WRRContinuityExample() {
  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          Rodízio WRR: Continuidade Individual da Lista
        </CardTitle>
        <p className="text-muted-foreground">
          Cada número mantém sua posição individual na lista de contatos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Lista de Contatos */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Lista: "Black Friday 2024" (10.000 contatos)
          </h4>
          <div className="grid grid-cols-10 gap-1 text-xs">
            {Array.from({length: 20}, (_, i) => (
              <div key={i} className={`p-2 rounded text-center ${
                i < 10 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
            ))}
            <div className="col-span-10 text-center text-muted-foreground mt-2">
              ... até 10.000
            </div>
          </div>
        </div>

        {/* Estado Atual do Rodízio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* WABA-01 */}
          <Card className="border-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+55 11 99999-0001</span>
                <Badge className="bg-success text-success-foreground">Green</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Peso: 60 (maior)</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-primary/10 p-3 rounded">
                <p className="text-sm font-medium">Posição atual na lista:</p>
                <p className="text-lg font-bold text-primary">#3.247</p>
                <p className="text-xs text-muted-foreground">Próximo: João Silva</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium">Mensagens enviadas:</p>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 4, 5, 7, 8, 10, 11].map(num => (
                    <Badge key={num} variant="outline" className="text-xs">
                      #{num}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">... 3.246</span>
                </div>
              </div>
              
              <Progress value={32} className="h-2" />
              <p className="text-xs text-center">32% da lista processada</p>
            </CardContent>
          </Card>

          {/* WABA-02 */}
          <Card className="border-blue-500/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+55 11 99999-0002</span>
                <Badge className="bg-success text-success-foreground">Green</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Peso: 40 (menor)</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-500/10 p-3 rounded">
                <p className="text-sm font-medium">Posição atual na lista:</p>
                <p className="text-lg font-bold text-blue-600">#2.156</p>
                <p className="text-xs text-muted-foreground">Próximo: Ana Santos</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium">Mensagens enviadas:</p>
                <div className="flex flex-wrap gap-1">
                  {[3, 6, 9, 12, 15].map(num => (
                    <Badge key={num} variant="outline" className="text-xs bg-blue-50">
                      #{num}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">... 2.155</span>
                </div>
              </div>
              
              <Progress value={21} className="h-2" />
              <p className="text-xs text-center">21% da lista processada</p>
            </CardContent>
          </Card>

          {/* WABA-03 */}
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="font-medium">+55 11 99999-0003</span>
                <Badge variant="outline">Standby</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Peso: 0 (inativo)</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-sm font-medium">Posição na lista:</p>
                <p className="text-lg font-bold text-muted-foreground">#1</p>
                <p className="text-xs text-muted-foreground">Pronto para iniciar</p>
              </div>
              
              <div className="text-center text-muted-foreground text-xs">
                Aguardando ativação
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cenário: WABA-01 Para */}
        <div className="border-2 border-dashed border-warning p-4 rounded-lg">
          <h4 className="font-medium text-warning mb-3">
            🔄 Cenário: WABA-01 tem problema (Quality Red)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-medium">❌ O que NÃO acontece (errado):</h5>
              <div className="bg-destructive/10 p-3 rounded text-sm">
                <p>• WABA-02 volta para o início da lista (#1)</p>
                <p>• Contatos recebem mensagens duplicadas</p>
                <p>• Progresso da campanha é perdido</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium">✅ O que acontece (correto):</h5>
              <div className="bg-success/10 p-3 rounded text-sm">
                <p>• WABA-02 continua da sua posição (#2.156)</p>
                <p>• WABA-03 assume as mensagens do WABA-01 a partir de (#3.247)</p>
                <p>• Lista continua sem lacunas ou duplicações</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado Após Failover */}
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
          <h4 className="font-medium mb-3 text-success">
            ✅ Estado após ativação do WABA-03:
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">WABA-02 (ativo):</p>
              <p>Continua da posição #2.156</p>
              <p>Peso aumentado para 60</p>
            </div>
            <div>
              <p className="font-medium">WABA-03 (novo ativo):</p>
              <p>Assume da posição #3.247</p>
              <p>Peso configurado para 40</p>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded">
            <p className="text-xs font-medium">🎯 Resultado:</p>
            <p className="text-xs">Zero contatos perdidos, zero duplicação, rodízio continua fluindo</p>
          </div>
        </div>

        {/* Resumo Técnico */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h4 className="font-medium mb-2">🔧 Como o sistema mantém a continuidade:</h4>
          <ul className="text-sm space-y-1">
            <li>• <strong>Ponteiro por WABA:</strong> Cada número tem sua posição individual na lista</li>
            <li>• <strong>Estado persistente:</strong> Posições são salvas em tempo real</li>
            <li>• <strong>Rodízio inteligente:</strong> WRR distribui baseado no peso, mas mantém sequência</li>
            <li>• <strong>Failover com herança:</strong> Número substituto herda a posição do que falhou</li>
            <li>• <strong>Zero overlap:</strong> Sistema garante que nenhum contato receba duplicado</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}