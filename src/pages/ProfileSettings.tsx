import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect, useRef } from "react"
import { Camera, Save, Phone, Mail, User, Upload, Loader2 } from "lucide-react"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useToast } from "@/hooks/use-toast"
import { processAndUploadAvatar } from "@/lib/imageUtils"

const ProfileSettings = () => {
  const { activeWorkspace } = useWorkspace()
  const { profile, loading, loadProfile, updateProfile, getInitials } = useUserProfile()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [removeBackground, setRemoveBackground] = useState(false)
  
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !activeWorkspace?.id) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Por favor, selecione uma imagem menor que 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const avatarUrl = await processAndUploadAvatar(file, activeWorkspace.id, removeBackground)
      
      const success = await updateProfile({ avatar_url: avatarUrl })
      
      if (success) {
        setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
        toast({
          title: "Foto atualizada",
          description: removeBackground 
            ? "Sua foto foi carregada e o fundo foi removido automaticamente!" 
            : "Sua foto de perfil foi atualizada com sucesso!",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a foto de perfil.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
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
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={formData.avatar_url} alt={formData.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(formData.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="avatar_url">URL da Foto de Perfil</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar_url"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={formData.avatar_url}
                      onChange={(e) => handleInputChange("avatar_url", e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCameraClick}
                      disabled={uploading}
                      title="Fazer upload de imagem"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cole a URL de uma imagem ou clique no botão da câmera para fazer upload
                  </p>
                </div>
              </div>

              {/* AI Background Removal Option */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="space-y-1">
                  <Label htmlFor="remove-background" className="text-sm font-medium">
                    Remover fundo automaticamente (AI)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use inteligência artificial para remover o fundo da sua foto
                  </p>
                </div>
                <Switch
                  id="remove-background"
                  checked={removeBackground}
                  onCheckedChange={setRemoveBackground}
                />
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
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
            <CardTitle>Suporte Técnico</CardTitle>
            <CardDescription>
              Precisa de ajuda? Entre em contato conosco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div><strong>Workspace:</strong> {activeWorkspace?.name}</div>
              <div><strong>ID:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">{activeWorkspace?.id}</code></div>
              <Button 
                onClick={() => {
                  const message = `Olá! Preciso de suporte técnico. Workspace: ${activeWorkspace?.name}`;
                  const whatsappUrl = `https://wa.me/5592981205772?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full gap-2"
              >
                <Phone className="w-4 h-4" />
                Entrar em Contato via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

export default ProfileSettings