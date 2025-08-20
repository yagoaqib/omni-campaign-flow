import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, Plus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WABAPublic } from "@/hooks/useWorkspace";

interface SecureWABAManagerProps {
  workspaceName?: string;
  wabas: WABAPublic[];
  onUpdate: () => Promise<void>;
}

interface WABACredentials {
  verify_token?: string;
  app_secret?: string;
  access_token?: string;
}

export default function SecureWABAManager({
  workspaceName = "Cliente",
  wabas,
  onUpdate,
}: SecureWABAManagerProps) {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [editingWaba, setEditingWaba] = useState<WABAPublic | null>(null);
  const [credentials, setCredentials] = useState<WABACredentials>({});
  const [newWaba, setNewWaba] = useState({
    name: "",
    meta_business_id: "",
    waba_id: "",
    verify_token: "",
  });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (wabas.length === 0) {
      setShowNewForm(true);
    }
  }, [wabas]);

  const toggleTokenVisibility = (wabaId: string, field: string) => {
    const key = `${wabaId}-${field}`;
    setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateWaba = async () => {
    if (!editingWaba) return;

    try {
      const { error } = await supabase.rpc('update_waba_credentials' as any, {
        p_waba_id: editingWaba.id,
        p_name: editingWaba.name,
        p_meta_business_id: editingWaba.meta_business_id,
        p_waba_id_text: editingWaba.waba_id,
        p_verify_token: credentials.verify_token,
        p_app_secret: null,
        p_access_token: null,
      });

      if (error) throw error;

      toast({
        title: "Credenciais atualizadas",
        description: "As credenciais da WABA foram salvas com sucesso.",
      });
      setEditingWaba(null);
      setCredentials({});
      await onUpdate();
    } catch (error) {
      console.error('Error updating WABA:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as credenciais. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateWaba = async () => {
    if (!newWaba.name || !newWaba.waba_id || !newWaba.verify_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, WABA ID e Verify Token são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('create_waba_secure' as any, {
        p_workspace_id: wabas[0]?.workspace_id, // Use workspace from existing WABAs
        p_name: newWaba.name,
        p_meta_business_id: newWaba.meta_business_id,
        p_waba_id: newWaba.waba_id,
        p_verify_token: newWaba.verify_token,
        p_app_secret: null,
        p_access_token: null,
      });

      if (error) throw error;

      toast({
        title: "WABA criada",
        description: "Nova WABA foi adicionada com sucesso.",
      });
      setNewWaba({
        name: "",
        meta_business_id: "",
        waba_id: "",
        verify_token: "",
      });
      setShowNewForm(false);
      await onUpdate();
    } catch (error) {
      console.error('Error creating WABA:', error);
      toast({
        title: "Erro ao criar WABA",
        description: "Não foi possível criar a WABA. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const renderTokenField = (
    wabaId: string,
    field: string,
    value: string,
    onChange: (value: string) => void,
    label: string,
    placeholder: string,
    required = false
  ) => {
    const key = `${wabaId}-${field}`;
    const isVisible = showTokens[key];

    return (
      <div className="space-y-2">
        <Label htmlFor={`${wabaId}-${field}`} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <Input
            id={`${wabaId}-${field}`}
            type={isVisible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => toggleTokenVisibility(wabaId, field)}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento Seguro de Credenciais</h2>
          <p className="text-muted-foreground">
            Configure as credenciais Meta WhatsApp para {workspaceName} com segurança aprimorada.
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Credenciais Protegidas</p>
              <p className="text-xs text-amber-700 mt-1">
                As credenciais sensíveis (tokens, secrets) são armazenadas de forma segura e não são expostas na interface.
                Apenas administradores podem atualizar essas informações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing WABAs */}
      {wabas.map((waba) => (
        <Card key={waba.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{waba.name || `WABA ${waba.waba_id}`}</CardTitle>
                <CardDescription>
                  WABA ID: {waba.waba_id} • Business ID: {waba.meta_business_id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-2">
                  <Shield className="h-3 w-3" />
                  Configurado
                </Badge>
                {editingWaba?.id === waba.id ? (
                  <Button
                    onClick={handleUpdateWaba}
                    size="sm"
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                ) : (
                  <Button
                    onClick={() => setEditingWaba(waba)}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingWaba?.id === waba.id ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${waba.id}-name`}>Nome da WABA</Label>
                  <Input
                    id={`${waba.id}-name`}
                    value={editingWaba.name || ""}
                    onChange={(e) => setEditingWaba({ ...editingWaba, name: e.target.value })}
                    placeholder="Nome identificador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${waba.id}-waba-id`}>WABA ID <span className="text-destructive">*</span></Label>
                  <Input
                    id={`${waba.id}-waba-id`}
                    value={editingWaba.waba_id}
                    onChange={(e) => setEditingWaba({ ...editingWaba, waba_id: e.target.value })}
                    placeholder="1234567890123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${waba.id}-business-id`}>Meta Business ID</Label>
                  <Input
                    id={`${waba.id}-business-id`}
                    value={editingWaba.meta_business_id}
                    onChange={(e) => setEditingWaba({ ...editingWaba, meta_business_id: e.target.value })}
                    placeholder="1234567890123456"
                  />
                </div>
                <div /> {/* Empty div for grid alignment */}
                {renderTokenField(
                  waba.id,
                  "verify_token",
                  credentials.verify_token || "",
                  (value) => setCredentials({ ...credentials, verify_token: value }),
                  "Verify Token",
                  "Seu_verify_token_customizado",
                  true
                )}
                
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant="default" className="ml-2">
                    <Shield className="h-3 w-3 mr-1" />
                    Credenciais seguras
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">
                    As credenciais estão armazenadas de forma segura. Use "Editar" para atualizar.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add New WABA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Nova WABA</CardTitle>
              <CardDescription>
                Adicione uma nova WABA para este cliente
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowNewForm(!showNewForm)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {showNewForm ? "Cancelar" : "Adicionar"}
            </Button>
          </div>
        </CardHeader>
        {showNewForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Nome da WABA <span className="text-destructive">*</span></Label>
                <Input
                  id="new-name"
                  value={newWaba.name}
                  onChange={(e) => setNewWaba({ ...newWaba, name: e.target.value })}
                  placeholder="Nome identificador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-waba-id">WABA ID <span className="text-destructive">*</span></Label>
                <Input
                  id="new-waba-id"
                  value={newWaba.waba_id}
                  onChange={(e) => setNewWaba({ ...newWaba, waba_id: e.target.value })}
                  placeholder="1234567890123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-business-id">Meta Business ID</Label>
                <Input
                  id="new-business-id"
                  value={newWaba.meta_business_id}
                  onChange={(e) => setNewWaba({ ...newWaba, meta_business_id: e.target.value })}
                  placeholder="1234567890123456"
                />
              </div>
              <div /> {/* Empty div for grid alignment */}
              {renderTokenField(
                "new",
                "verify_token",
                newWaba.verify_token,
                (value) => setNewWaba({ ...newWaba, verify_token: value }),
                "Verify Token",
                "Seu_verify_token_customizado",
                true
              )}
              
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWaba} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar WABA
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Configuração do Webhook</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Configure o webhook no Meta Developer Console com a URL:
        </p>
        <code className="bg-background px-3 py-2 rounded text-sm block">
          https://ehqspernqapvxiijjkuk.supabase.co/functions/v1/webhook-meta
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Use o <strong>Verify Token</strong> específico de cada WABA na configuração do webhook no Facebook.
        </p>
      </div>
    </div>
  );
}
