import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, Mail, Plus, Trash2, Users, UserPlus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspace } from "@/hooks/useWorkspace"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Invitation {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: string // Changed from union type to string for flexibility
  token: string
  expires_at: string
  created_at: string
}

interface Member {
  user_id: string
  role: string // Changed to string for flexibility
  created_at: string
  email?: string
}

export function UserManagement() {
  const { user } = useAuth()
  const { activeWorkspace, loadWorkspaces } = useWorkspace()
  const { toast } = useToast()
  
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as 'owner' | 'admin' | 'member'
  })

  const loadInvitations = async () => {
    if (!activeWorkspace?.id) return

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
    }
  }

  const loadMembers = async () => {
    if (!activeWorkspace?.id) return

    try {
      // Get members with user emails
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          user_id
        `)
        .eq('workspace_id', activeWorkspace.id)

      if (error) throw error
      
      const memberPromises = (data || []).map(async (member) => {
        try {
          // Try to get user profile first
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email, name')
            .eq('workspace_id', activeWorkspace.id)
            .limit(1)
            .maybeSingle()

          return {
            user_id: member.user_id,
            role: member.role,
            created_at: member.created_at,
            email: profile?.email || 'Email não disponível'
          }
        } catch {
          return {
            user_id: member.user_id,
            role: member.role, 
            created_at: member.created_at,
            email: 'Email não disponível'
          }
        }
      })

      const membersWithEmails = await Promise.all(memberPromises)
      setMembers(membersWithEmails)
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  useEffect(() => {
    // Force load workspaces when component mounts
    loadWorkspaces()
  }, [loadWorkspaces])

  useEffect(() => {
    if (activeWorkspace?.id) {
      console.log("UserManagement: Active workspace found:", activeWorkspace.name)
      loadInvitations()
      loadMembers()
    } else {
      console.log("UserManagement: No active workspace")
    }
  }, [activeWorkspace?.id])

  const handleSendInvite = async () => {
    if (!activeWorkspace?.id || !inviteForm.email.trim()) return

    setLoading(true)
    try {
      const { data: token, error } = await supabase
        .rpc('create_invitation', {
          _workspace_id: activeWorkspace.id,
          _email: inviteForm.email.toLowerCase(),
          _role: inviteForm.role
        })

      if (error) {
        throw error
      }

      // Generate invite URL
      const inviteUrl = `${window.location.origin}/auth?invite=${token}`
      
      toast({
        title: "Convite criado",
        description: "Copie o link abaixo e envie para o usuário.",
      })

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteUrl)
      
      toast({
        title: "Link copiado",
        description: "O link do convite foi copiado para a área de transferência.",
      })

      setInviteForm({ email: "", role: "member" })
      setShowInviteDialog(false)
      loadInvitations()
    } catch (error: any) {
      console.error('Error creating invitation:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o convite.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${token}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast({
        title: "Link copiado",
        description: "O link do convite foi copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      })
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)

      if (error) throw error

      toast({
        title: "Convite excluído",
        description: "O convite foi removido com sucesso.",
      })

      loadInvitations()
    } catch (error: any) {
      console.error('Error deleting invitation:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o convite.",
        variant: "destructive",
      })
    }
  }

  const getRoleDisplay = (role: string) => {
    const roles = {
      owner: "Proprietário",
      admin: "Administrador", 
      member: "Membro"
    }
    return roles[role as keyof typeof roles] || role
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default'
      case 'admin': return 'secondary'
      default: return 'outline'
    }
  }

  if (!activeWorkspace) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">
            Selecione um workspace para gerenciar usuários
          </p>
          <Button onClick={loadWorkspaces} variant="outline">
            Recarregar Workspaces
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Membros do Workspace
              </CardTitle>
              <CardDescription>
                Usuários com acesso ao workspace {activeWorkspace.name}
              </CardDescription>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Convidar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Envie um convite para adicionar um novo usuário ao workspace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="usuario@exemplo.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Função</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value: 'owner' | 'admin' | 'member') => 
                        setInviteForm({ ...inviteForm, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="owner">Proprietário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleSendInvite} 
                    disabled={loading || !inviteForm.email.trim()}
                    className="w-full"
                  >
                    {loading ? "Criando convite..." : "Criar Convite"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{member.email}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Membro desde {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {getRoleDisplay(member.role)}
                </Badge>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum membro encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invitations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Convites Pendentes
          </CardTitle>
          <CardDescription>
            Convites enviados que ainda não foram aceitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge variant={getRoleBadgeVariant(invitation.role)}>
                      {getRoleDisplay(invitation.role)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expira em {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(invitation.token)}
                    className="gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteInvitation(invitation.id)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
            {invitations.filter(inv => inv.status === 'pending').length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum convite pendente
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Como funciona:</strong> Após criar um convite, copie o link e envie para o usuário. 
          Ele deve acessar o link, criar uma conta com o mesmo email do convite e será automaticamente 
          adicionado ao workspace.
        </AlertDescription>
      </Alert>
    </div>
  )
}