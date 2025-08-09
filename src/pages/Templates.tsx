import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, Eye, BarChart3, MessageSquare } from "lucide-react"

const Templates = () => {
  const templates = [
    {
      id: 1,
      name: "welcome_message_v2",
      language: "pt_BR",
      status: "APPROVED",
      category: "MARKETING",
      hasMedia: true,
      variables: 2,
      usage: 1247,
      ctr: "12.5%",
      deliveryRate: "98.2%"
    },
    {
      id: 2,
      name: "order_confirmation",
      language: "pt_BR", 
      status: "APPROVED",
      category: "TRANSACTIONAL",
      hasMedia: false,
      variables: 4,
      usage: 8934,
      ctr: "8.7%",
      deliveryRate: "99.1%"
    },
    {
      id: 3,
      name: "black_friday_promo",
      language: "pt_BR",
      status: "PENDING",
      category: "MARKETING",
      hasMedia: true,
      variables: 3,
      usage: 0,
      ctr: "-",
      deliveryRate: "-"
    },
    {
      id: 4,
      name: "cart_abandonment_v3",
      language: "pt_BR",
      status: "APPROVED",
      category: "MARKETING", 
      hasMedia: true,
      variables: 5,
      usage: 2847,
      ctr: "15.2%",
      deliveryRate: "97.8%"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-success-soft text-success"
      case "PENDING": return "bg-warning-soft text-warning"
      case "REJECTED": return "bg-destructive-soft text-destructive"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MARKETING": return "bg-primary/10 text-primary"
      case "TRANSACTIONAL": return "bg-accent text-accent-foreground"
      case "UTILITY": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground">
              Gerencie seus templates de mensagem WhatsApp
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">Todos os Status</Button>
          <Button variant="outline">Todas as Categorias</Button>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-soft transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg font-mono">{template.name}</CardTitle>
                      {template.hasMedia && (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Mídia
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(template.status)}>
                        {template.status}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={getCategoryColor(template.category)}
                      >
                        {template.category}
                      </Badge>
                      <Badge variant="outline">
                        {template.language}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{template.variables}</div>
                    <div className="text-muted-foreground">Variáveis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{template.usage.toLocaleString()}</div>
                    <div className="text-muted-foreground">Usos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">{template.ctr}</div>
                    <div className="text-muted-foreground">CTR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-success">{template.deliveryRate}</div>
                    <div className="text-muted-foreground">Entrega</div>
                  </div>
                  <div className="text-center">
                    <Button size="sm" disabled={template.status !== "APPROVED"}>
                      Usar Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Preview Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Preview do Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
              <p className="text-muted-foreground text-center">
                Selecione um template para visualizar a prévia
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default Templates