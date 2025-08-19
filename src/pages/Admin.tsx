import { AppLayout } from "@/components/layout/AppLayout"
import SecureWABAManager from "@/components/admin/SecureWABAManager"
import { UserManagement } from "@/components/admin/UserManagement"
import { useWorkspace } from "@/hooks/useWorkspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Check, X, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const Admin = () => {
  const { activeWorkspace, wabas, workspaces, loading, loadWorkspaces, loadWabas, deleteWorkspace } = useWorkspace();
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    console.log("Admin page: Loading workspaces...");
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    console.log("Admin page: Workspaces updated:", workspaces);
  }, [workspaces]);

  const handleEditWorkspace = (workspaceId: string, currentName: string) => {
    setEditingWorkspace(workspaceId);
    setEditName(currentName);
  };

  const handleSaveWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name: editName })
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: "Workspace atualizado",
        description: "Nome do workspace foi alterado com sucesso.",
      });

      setEditingWorkspace(null);
      loadWorkspaces();
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o workspace.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    const success = await deleteWorkspace(workspaceId);
    if (success) {
      toast({
        title: "Workspace excluído",
        description: `Workspace "${workspaceName}" foi excluído com sucesso.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o workspace.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingWorkspace(null);
    setEditName("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground">Configurações de workspaces, usuários e credenciais Meta WhatsApp Cloud</p>
        </div>
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp API</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="workspaces">
            <Card>
              <CardHeader>
                <CardTitle>Workspaces</CardTitle>
                <CardDescription>
                  Gerencie os nomes dos seus workspaces
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {editingWorkspace === workspace.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1"
                          placeholder="Nome do workspace"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveWorkspace(workspace.id)}
                          disabled={!editName.trim()}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-medium">{workspace.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditWorkspace(workspace.id, workspace.name)}
                            title="Editar workspace"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                title="Excluir workspace"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Workspace</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o workspace "{workspace.name}"? 
                                  Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {workspaces.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {loading ? "Carregando workspaces..." : "Nenhum workspace encontrado"}
                  </p>
                )}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Debug info:</strong> Total workspaces: {workspaces.length}
                    {workspaces.length > 0 && (
                      <span>, Names: {workspaces.map(w => w.name).join(", ")}</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            {activeWorkspace && (
              <SecureWABAManager 
                workspaceName={activeWorkspace.name}
                wabas={wabas}
                onUpdate={async () => {
                  await loadWabas(activeWorkspace.id);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default Admin