import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import PoolEditor from "@/components/senders/PoolEditor"
import { useState } from "react"
import { Phone, Play, Pause, Settings, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { useRealPhoneNumbers } from "@/hooks/useRealPhoneNumbers"
import { useRealTimeMetrics } from "@/hooks/useRealTimeMetrics"
import { toast } from "sonner"

const Senders = () => {
  const { phoneNumbers, loading, refreshNumbers, updatePhoneNumberStatus, updateMpsTarget } = useRealPhoneNumbers();
  const { metrics } = useRealTimeMetrics();
  const [openEditor, setOpenEditor] = useState(false);
  const [autoBalance, setAutoBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNumbers();
    setRefreshing(false);
  };

  const handleStatusToggle = async (phoneNumberId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await updatePhoneNumberStatus(phoneNumberId, newStatus);
      toast.success(`Número ${newStatus === 'ACTIVE' ? 'reativado' : 'pausado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao alterar status do número');
    }
  };

  const handleMpsUpdate = async (phoneNumberId: string, newMps: number) => {
    try {
      await updateMpsTarget(phoneNumberId, newMps);
      toast.success('MPS atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar MPS');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-success-soft text-success"
      case "PAUSED": return "bg-warning-soft text-warning"
      case "BLOCKED": return "bg-destructive-soft text-destructive"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "HIGH": return "bg-success-soft text-success"
      case "MEDIUM": return "bg-warning-soft text-warning"
      case "LOW": return "bg-destructive-soft text-destructive"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
      case "PAUSED": return <Pause className="w-4 h-4 text-warning" />
      case "BLOCKED": return <AlertTriangle className="w-4 h-4 text-destructive" />
      default: return <div className="w-2 h-2 bg-muted rounded-full"></div>
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Números & Senders</h1>
            <p className="text-muted-foreground">Monitore a saúde e o rodízio dos seus números</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <div className="font-medium">Pool Marketing BR ({phoneNumbers.length} números)</div>
              <div className="text-muted-foreground">Política: WRR + Auto-Throttle</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Balanceamento automático</span>
              <Switch checked={autoBalance} onCheckedChange={(v) => setAutoBalance(!!v)} />
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={() => setOpenEditor(true)}>Editar Pool</Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Phone className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{phoneNumbers.length}</div>
                  <div className="text-sm text-muted-foreground">Números Configurados</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-success rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{metrics.numbers.high_quality}</div>
                  <div className="text-sm text-muted-foreground">Qualidade Alta</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-warning rounded-full"></div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{metrics.numbers.medium_quality}</div>
                  <div className="text-sm text-muted-foreground">Qualidade Média</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-success" />
                <div>
                  <div className="text-2xl font-bold">
                    {metrics.messages.deliveryRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Entrega Média</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phone Numbers Grid */}
        <div className="grid gap-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Carregando números...</p>
              </CardContent>
            </Card>
          ) : phoneNumbers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum número configurado</p>
                <p className="text-sm text-muted-foreground">Configure números na aba Admin para começar</p>
              </CardContent>
            </Card>
          ) : (
            phoneNumbers.map((phoneNumber) => (
              <Card key={phoneNumber.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(phoneNumber.status)}
                        <CardTitle className="text-lg font-mono">{phoneNumber.display_number}</CardTitle>
                        <Badge variant="outline">{phoneNumber.waba?.name || 'Sem WABA'}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">ID: {phoneNumber.phone_number_id}</div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(phoneNumber.status)}>
                          {phoneNumber.status}
                        </Badge>
                        <Badge className={getQualityColor(phoneNumber.quality_rating)}>
                          Qualidade: {phoneNumber.quality_rating}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={phoneNumber.status === "PAUSED" ? "default" : "outline"}
                        className="gap-1"
                        onClick={() => handleStatusToggle(phoneNumber.id, phoneNumber.status)}
                      >
                        {phoneNumber.status === "PAUSED" ? (
                          <>
                            <Play className="w-3 h-3" />
                            Reativar
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3" />
                            Pausar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* MPS Target */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">MPS Target</span>
                      <span>{phoneNumber.mps_target}/min</span>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        value={phoneNumber.mps_target} 
                        onChange={(e) => handleMpsUpdate(phoneNumber.id, Number(e.target.value))}
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold">{phoneNumber.todayStats.sent}</div>
                      <div className="text-xs text-muted-foreground">Enviadas Hoje</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">{phoneNumber.todayStats.delivered}</div>
                      <div className="text-xs text-muted-foreground">Entregues</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">{phoneNumber.todayStats.failed}</div>
                      <div className="text-xs text-muted-foreground">Falhas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">
                        {phoneNumber.todayStats.delivery_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Taxa de Entrega</div>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="text-xs text-muted-foreground border-t pt-3">
                    Criado em: {new Date(phoneNumber.created_at).toLocaleDateString('pt-BR')}
                    {phoneNumber.last_health_at && (
                      <span> • Última verificação: {new Date(phoneNumber.last_health_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <PoolEditor open={openEditor} onOpenChange={setOpenEditor} />
    </AppLayout>
  )
}

export default Senders