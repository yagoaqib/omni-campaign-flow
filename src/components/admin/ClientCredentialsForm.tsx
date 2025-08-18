import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type WABA = Database["public"]["Tables"]["wabas"]["Row"];

interface ClientCredentialsFormProps {
  workspaceName?: string;
  wabas: WABA[];
  onUpdateWaba: (waba: WABA) => Promise<boolean>;
  onCreateWaba: (waba: Partial<WABA>) => Promise<boolean>;
}

export default function ClientCredentialsForm({
  workspaceName = "Cliente",
  wabas,
  onUpdateWaba,
  onCreateWaba,
}: ClientCredentialsFormProps) {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [editingWaba, setEditingWaba] = useState<WABA | null>(null);
  const [newWaba, setNewWaba] = useState<Partial<WABA>>({
    name: "",
    meta_business_id: "",
    waba_id: "",
    verify_token: "",
    app_secret: "",
    access_token: "",
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

  const handleUpdateWaba = async (waba: WABA) => {
    const success = await onUpdateWaba(waba);
    if (success) {
      toast({
        title: "Credenciais atualizadas",
        description: "As credenciais da WABA foram salvas com sucesso.",
      });
      setEditingWaba(null);
    } else {
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

    const success = await onCreateWaba(newWaba);
    if (success) {
      toast({
        title: "WABA criada",
        description: "Nova WABA foi adicionada com sucesso.",
      });
      setNewWaba({
        name: "",
        meta_business_id: "",
        waba_id: "",
        verify_token: "",
        app_secret: "",
        access_token: "",
      });
      setShowNewForm(false);
    } else {
      toast({
        title: "Erro ao criar WABA",
        description: "Não foi possível criar a WABA. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const renderTokenField = (
    wabaId: string,
    field: keyof WABA,
    value: string | null,
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
            value={value || ""}
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
      <div>
        <h2 className="text-2xl font-bold">Credenciais Meta WhatsApp Cloud</h2>
        <p className="text-muted-foreground">
          Configure as credenciais para {workspaceName}. Cada WABA precisa de suas próprias credenciais.
        </p>
      </div>

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
                <Badge variant={waba.verify_token ? "default" : "secondary"}>
                  {waba.verify_token ? "Configurado" : "Incompleto"}
                </Badge>
                {editingWaba?.id === waba.id ? (
                  <Button
                    onClick={() => handleUpdateWaba(editingWaba)}
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
                {renderTokenField(
                  waba.id,
                  "verify_token",
                  editingWaba.verify_token,
                  (value) => setEditingWaba({ ...editingWaba, verify_token: value }),
                  "Verify Token",
                  "Seu_verify_token_customizado",
                  true
                )}
                {renderTokenField(
                  waba.id,
                  "app_secret",
                  editingWaba.app_secret,
                  (value) => setEditingWaba({ ...editingWaba, app_secret: value }),
                  "App Secret",
                  "a1b2c3d4e5f6...",
                )}
                {renderTokenField(
                  waba.id,
                  "access_token",
                  editingWaba.access_token,
                  (value) => setEditingWaba({ ...editingWaba, access_token: value }),
                  "Access Token",
                  "EAAxxxxxxxxxxxxxxx"
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Verify Token:</span>{" "}
                  <code className="bg-muted px-2 py-1 rounded">
                    {waba.verify_token ? "••••••••" : "Não configurado"}
                  </code>
                </div>
                <div>
                  <span className="font-medium">App Secret:</span>{" "}
                  <code className="bg-muted px-2 py-1 rounded">
                    {waba.app_secret ? "••••••••" : "Não configurado"}
                  </code>
                </div>
                <div>
                  <span className="font-medium">Access Token:</span>{" "}
                  <code className="bg-muted px-2 py-1 rounded">
                    {waba.access_token ? "••••••••" : "Não configurado"}
                  </code>
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
                  value={newWaba.name || ""}
                  onChange={(e) => setNewWaba({ ...newWaba, name: e.target.value })}
                  placeholder="Nome identificador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-waba-id">WABA ID <span className="text-destructive">*</span></Label>
                <Input
                  id="new-waba-id"
                  value={newWaba.waba_id || ""}
                  onChange={(e) => setNewWaba({ ...newWaba, waba_id: e.target.value })}
                  placeholder="1234567890123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-business-id">Meta Business ID</Label>
                <Input
                  id="new-business-id"
                  value={newWaba.meta_business_id || ""}
                  onChange={(e) => setNewWaba({ ...newWaba, meta_business_id: e.target.value })}
                  placeholder="1234567890123456"
                />
              </div>
              {renderTokenField(
                "new",
                "verify_token",
                newWaba.verify_token || "",
                (value) => setNewWaba({ ...newWaba, verify_token: value }),
                "Verify Token",
                "Seu_verify_token_customizado",
                true
              )}
              {renderTokenField(
                "new",
                "app_secret",
                newWaba.app_secret || "",
                (value) => setNewWaba({ ...newWaba, app_secret: value }),
                "App Secret",
                "a1b2c3d4e5f6..."
              )}
              {renderTokenField(
                "new",
                "access_token",
                newWaba.access_token || "",
                (value) => setNewWaba({ ...newWaba, access_token: value }),
                "Access Token",
                "EAAxxxxxxxxxxxxxxx"
              )}
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
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
          https://ehqspernqapvxiijjkuk.supabase.co/functions/v1/webhooks-whatsapp
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Use o <strong>Verify Token</strong> específico de cada WABA na configuração do webhook no Facebook.
        </p>
      </div>
    </div>
  );
}
