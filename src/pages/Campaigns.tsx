import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Pause, Copy, BarChart3, Download } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect } from "react"
import { useCampaigns } from "@/hooks/useCampaigns"
import { useToast } from "@/hooks/use-toast"
import { useWorkspace } from "@/hooks/useWorkspace"

const Campaigns = () => {
  const { activeWorkspace } = useWorkspace()
  const { campaigns, loading, loadCampaigns, updateCampaignStatus } = useCampaigns()
  
  const pauseCampaign = (id: string) => updateCampaignStatus(id, "PAUSED")
  const resumeCampaign = (id: string) => updateCampaignStatus(id, "RUNNING")
  const { toast } = useToast()

  useEffect(() => { 
    document.title = "Campanhas | Console"
    if (activeWorkspace?.id) {
      loadCampaigns(activeWorkspace.id)
    }
  }, [activeWorkspace?.id, loadCampaigns])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING": return "bg-success-soft text-success"
      case "PAUSED": return "bg-warning-soft text-warning"
      case "COMPLETED": return "bg-muted text-muted-foreground"
      case "DRAFT": return "bg-secondary text-secondary-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const handlePauseResume = async (campaignId: string, currentStatus: string) => {
    try {
      if (currentStatus === "RUNNING") {
        await pauseCampaign(campaignId)
        toast({ title: "Campanha pausada", description: "A campanha foi pausada com sucesso." })
      } else {
        await resumeCampaign(campaignId)
        toast({ title: "Campanha retomada", description: "A campanha foi retomada com sucesso." })
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha ao alterar status da campanha.",
        variant: "destructive"
      })
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Gerencie suas campanhas de WhatsApp
            </p>
          </div>
            <div className="flex items-center gap-2">
              <Link to="/campaigns/new?type=farm" title="Conjunto reutilizável de números, cotas e cadeias de templates">
                <Button variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Grupos de Envio
                </Button>
              </Link>
            </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid gap-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando campanhas...</p>
              </CardContent>
            </Card>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma campanha encontrada.</p>
                <Link to="/campaigns/new">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Campanha
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      <Badge variant="outline">{campaign.desired_category}</Badge>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                    {campaign.status === "RUNNING" ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handlePauseResume(campaign.id, campaign.status)}
                      >
                        <Pause className="w-3 h-3" />
                        Pausar
                      </Button>
                    ) : campaign.status === "PAUSED" ? (
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handlePauseResume(campaign.id, campaign.status)}
                      >
                        <Play className="w-3 h-3" />
                        Retomar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campaign Info */}
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Criado em: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    {campaign.deadline_at && (
                      <span className="ml-4">
                        Prazo: {new Date(campaign.deadline_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  
                  {campaign.status === "DRAFT" && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">
                        Esta campanha ainda está em rascunho.
                      </p>
                      <Link to={`/campaigns/edit/${campaign.id}`}>
                        <Button>Configurar Campanha</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Campaigns