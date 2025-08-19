import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

const Auth = () => {
  const [loading, setLoading] = useState(false)
  const [checkingRegistration, setCheckingRegistration] = useState(true)
  const [registrationAllowed, setRegistrationAllowed] = useState(false)
  const [inviteToken, setInviteToken] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteToken: "",
  })

  // Check if user is already authenticated and check registration status
  useEffect(() => {
    const checkAuthAndRegistration = async () => {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate("/")
        return
      }

      // Check URL for invite token
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('invite')
      if (token) {
        setInviteToken(token)
        setSignupForm(prev => ({ ...prev, inviteToken: token }))
        // If there's an invite token, allow registration
        setRegistrationAllowed(true)
      } else {
        // Check if registration is allowed (no users exist yet)
        try {
          const { data, error } = await supabase.rpc('is_registration_allowed')
          if (error) {
            console.error('Error checking registration status:', error)
            setRegistrationAllowed(false)
          } else {
            setRegistrationAllowed(data)
          }
        } catch (error) {
          console.error('Error checking registration status:', error)
          setRegistrationAllowed(false)
        }
      }
      setCheckingRegistration(false)
    }
    checkAuthAndRegistration()
  }, [navigate])

  // Cleanup auth state utility
  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key)
      }
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Clean up existing state
      cleanupAuthState()
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError("Email ou senha incorretos")
        } else if (error.message.includes('Email not confirmed')) {
          setError("Por favor, confirme seu email antes de fazer login")
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        toast({
          title: "Login realizado",
          description: "Bem-vindo de volta!",
        })
        // Force page reload for clean state
        window.location.href = "/"
      }
    } catch (error: any) {
      setError("Erro inesperado. Tente novamente.")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (signupForm.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    // Check if invite token is required but missing
    if (!registrationAllowed && !signupForm.inviteToken.trim()) {
      setError("Um token de convite é necessário para criar uma conta")
      setLoading(false)
      return
    }

    try {
      // Clean up existing state
      cleanupAuthState()

      const redirectUrl = `${window.location.origin}/`

      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signupForm.name,
          }
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          setError("Este email já está cadastrado. Tente fazer login.")
        } else if (error.message.includes('Password should be at least')) {
          setError("A senha deve ter pelo menos 6 caracteres")
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // If this is the first user, set up the workspace
        if (registrationAllowed && !signupForm.inviteToken) {
          try {
            const { data: workspaceId, error: setupError } = await supabase
              .rpc('setup_first_user', { user_id: data.user.id, workspace_name: 'Meu Workspace' })
            
            if (setupError) {
              console.error('Error setting up first user:', setupError)
            } else {
              console.log('First user workspace created:', workspaceId)
            }
          } catch (setupError) {
            console.error('Error in setup_first_user:', setupError)
          }
        }
        
        // If there's an invite token, try to accept it after email confirmation
        if (signupForm.inviteToken && data.user.email_confirmed_at) {
          try {
            const { error: inviteError } = await supabase
              .rpc('accept_invitation', { p_token: signupForm.inviteToken })
            
            if (inviteError) {
              console.error('Error accepting invitation:', inviteError)
              toast({
                title: "Aviso",
                description: "Conta criada, mas houve erro ao aceitar o convite. Entre em contato com o administrador.",
                variant: "destructive",
              })
            } else {
              toast({
                title: "Convite aceito",
                description: "Sua conta foi criada e você foi adicionado ao workspace!",
              })
            }
          } catch (inviteError) {
            console.error('Error accepting invitation:', inviteError)
          }
        }

        if (data.user.email_confirmed_at) {
          toast({
            title: "Conta criada",
            description: "Sua conta foi criada com sucesso!",
          })
          // Auto-login after signup if email is confirmed
          window.location.href = "/"
        } else {
          toast({
            title: "Verifique seu email",
            description: "Enviamos um link de confirmação para seu email.",
          })
          // Clear form
          setSignupForm({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            inviteToken: "",
          })
        }
      }
    } catch (error: any) {
      setError("Erro inesperado. Tente novamente.")
      console.error("Signup error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (checkingRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verificando status de registro...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">OmniFlow</CardTitle>
          <CardDescription>
            {inviteToken ? "Complete seu cadastro com o convite" : "Entre na sua conta ou crie uma nova"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={inviteToken ? "signup" : "login"} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup" disabled={!registrationAllowed && !inviteToken}>
                {registrationAllowed || inviteToken ? "Cadastrar" : "Cadastro Fechado"}
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!registrationAllowed && !inviteToken && (
              <Alert>
                <AlertDescription>
                  O registro público está fechado. Entre em contato com um administrador para receber um convite.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {!registrationAllowed && !inviteToken ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    O registro público está fechado. Entre em contato com um administrador para receber um convite.
                  </p>
                </div>
              ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {inviteToken && (
                  <div className="space-y-2">
                    <Label htmlFor="invite-token">Token de Convite</Label>
                    <Input
                      id="invite-token"
                      type="text"
                      value={inviteToken}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                )}
                
                {!registrationAllowed && !inviteToken && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-invite-token">Token de Convite</Label>
                    <Input
                      id="signup-invite-token"
                      type="text"
                      placeholder="Cole aqui seu token de convite"
                      value={signupForm.inviteToken}
                      onChange={(e) => setSignupForm({ ...signupForm, inviteToken: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth