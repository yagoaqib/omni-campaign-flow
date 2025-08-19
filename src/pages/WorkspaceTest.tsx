import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useCampaigns } from "@/hooks/useCampaigns"
import { useContactsManagement } from "@/hooks/useContactsManagement"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"

const WorkspaceTest = () => {
  const { activeWorkspace, workspaces, switchWorkspace } = useWorkspace()
  const { campaigns, loadCampaigns } = useCampaigns()
  const { contacts, contactLists } = useContactsManagement()

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadCampaigns(activeWorkspace.id)
    }
  }, [activeWorkspace?.id, loadCampaigns])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teste de Isolamento de Workspaces</h1>
          <p className="text-muted-foreground">
            Demonstração de que cada workspace tem dados isolados
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Workspace atual:</strong> {activeWorkspace?.name || "Nenhum"}
              </div>
              
              <div className="flex gap-2">
                {workspaces.map(workspace => (
                  <Button
                    key={workspace.id}
                    variant={workspace.id === activeWorkspace?.id ? "default" : "outline"}
                    onClick={() => switchWorkspace(workspace)}
                  >
                    {workspace.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas neste Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total: <Badge variant="secondary">{campaigns.length}</Badge>
                </div>
                {campaigns.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
                ) : (
                  <div className="space-y-2">
                    {campaigns.slice(0, 3).map(campaign => (
                      <div key={campaign.id} className="p-2 border rounded text-sm">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-muted-foreground">
                          Status: <Badge variant="outline">{campaign.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {campaigns.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        + {campaigns.length - 3} mais...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contatos neste Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total: <Badge variant="secondary">{contacts.length}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Listas: <Badge variant="secondary">{contactLists.length}</Badge>
                </div>
                {contacts.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum contato encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.slice(0, 3).map(contact => (
                      <div key={contact.id} className="p-2 border rounded text-sm">
                        <div className="font-medium">{contact.name || "Sem nome"}</div>
                        <div className="text-muted-foreground">{contact.phone}</div>
                      </div>
                    ))}
                    {contacts.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        + {contacts.length - 3} mais...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como Testar o Isolamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Crie algumas campanhas e contatos no workspace atual</li>
              <li>Troque para outro workspace usando os botões acima</li>
              <li>Verifique que os dados são diferentes para cada workspace</li>
              <li>Crie dados no novo workspace e confirme que não aparecem no anterior</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default WorkspaceTest