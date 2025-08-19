import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Camera, Save, Phone, Mail, User } from "lucide-react"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useToast } from "@/hooks/use-toast"

const ProfileSettings = () => {
  const { activeWorkspace } = useWorkspace()
  const { profile, loading, loadProfile, updateProfile, getInitials } = useUserProfile()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar_url: ""
  })

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadProfile(activeWorkspace.id)
    }
  }, [activeWorkspace?.id, loadProfile])

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || ""
      })
    }
  }, [profile])

  const handleSave = async () => {
    const success = await updateProfile(formData)
    
    if (success) {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Carregando perfil...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.avatar_url} alt={formData.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL da Foto de Perfil</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar_url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange("avatar_url", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cole a URL de uma imagem ou use o botão para fazer upload
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Atual</CardTitle>
            <CardDescription>
              Configurações específicas do workspace ativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Workspace:</strong> {activeWorkspace?.name}</div>
              <div><strong>ID:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">{activeWorkspace?.id}</code></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default ProfileSettings