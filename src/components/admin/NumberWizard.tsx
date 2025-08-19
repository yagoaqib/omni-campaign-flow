import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import type { ExtendedNumber } from "./NumbersIntegration";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { createMetaApi } from "@/services/metaApi";
import { createInfobipApi } from "@/services/infobipApi";
import { createGupshupApi } from "@/services/gupshupApi";
import { supabase } from "@/integrations/supabase/client";

// Tipos auxiliares
type Provider = "meta" | "infobip" | "gupshup";
type Usage = "marketing" | "transacional" | "ambos";

type WizardProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (n: ExtendedNumber) => void;
};

const POOLS = ["Pool Marketing BR", "Pool Transacional BR", "Pool Global LATAM"];

export default function NumberWizard({ open, onOpenChange, onSave }: WizardProps) {
  const { toast } = useToast();
  const { activeWorkspace, wabas } = useWorkspace();
  const { savePhoneNumber } = usePhoneNumbers();

  const HelpHint = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground" aria-label="Ajuda">
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-line">{text}</TooltipContent>
    </Tooltip>
  );

  // Passo 1 — comum
  const [label, setLabel] = React.useState("");
  const [phoneE164, setPhoneE164] = React.useState("");
  const [provider, setProvider] = React.useState<Provider>("meta");
  const [usage, setUsage] = React.useState<Usage | "">("");
  const [tps, setTps] = React.useState<number>(10);
  const [pools, setPools] = React.useState<string[]>([]);
  const [canFallback, setCanFallback] = React.useState<boolean>(true);

  // Passo 2 — específicos
  const [selectedWaba, setSelectedWaba] = React.useState<string>("");
  const [meta, setMeta] = React.useState({
    waba_id: "",
    phone_number_id: "",
    access_token: "",
    graph_version: "v19.0",
    app_id: "",
  });
  const [infobip, setInfobip] = React.useState({
    base_url: "",
    api_key: "",
    from: "",
    dlr_secret: "",
    inbound_secret: "",
  });
  const [gupshup, setGupshup] = React.useState({
    api_key: "",
    app: "",
    source: "",
    callback_secret: "",
    environment: "live" as "live" | "sandbox",
  });

  // Passo 3 — verificações/sync (simulados)
  const [connOk, setConnOk] = React.useState<boolean | null>(null);
  const [connMsg, setConnMsg] = React.useState<string>("");
  const [webhookOk, setWebhookOk] = React.useState<boolean | null>(null);
  const [tplSyncOk, setTplSyncOk] = React.useState<boolean | null>(null);
  const [tplStats, setTplStats] = React.useState({ approved: 0, pending: 0, rejected: 0 });
  const [quality, setQuality] = React.useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [tier, setTier] = React.useState<string>("10k");

  const resetAll = () => {
    setLabel("");
    setPhoneE164("");
    setProvider("meta");
    setUsage("");
    setTps(10);
    setPools([]);
    setCanFallback(true);
    setMeta({ waba_id: "", phone_number_id: "", access_token: "", graph_version: "v19.0", app_id: "" });
    setInfobip({ base_url: "", api_key: "", from: "", dlr_secret: "", inbound_secret: "" });
    setGupshup({ api_key: "", app: "", source: "", callback_secret: "", environment: "live" });
    setConnOk(null); setConnMsg(""); setWebhookOk(null); setTplSyncOk(null);
    setTplStats({ approved: 0, pending: 0, rejected: 0 });
    setQuality("HIGH"); setTier("10k");
  };

  // Steps
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const canNext1 = () => {
    const labelOk = label.trim().length >= 3 && label.trim().length <= 40;
    const phoneOk = /^\+[1-9]\d{7,14}$/.test(phoneE164);
    return labelOk && phoneOk && !!provider && tps >= 1;
  };

  const testConnection = async () => {
    setConnMsg("Testando...");
    setConnOk(null);
    
    try {
      let result = { success: false, message: "" };
      
      if (provider === "meta") {
        const selectedWabaData = wabas.find(w => w.id === selectedWaba);
        if (!selectedWabaData) {
          throw new Error("WABA não selecionada");
        }
        
        // For now, use placeholder token - should get from secure credentials
        const api = createMetaApi({
          access_token: "placeholder_token",
          waba_id: selectedWabaData.waba_id,
          phone_number_id: meta.phone_number_id,
          graph_version: meta.graph_version
        });
        
        const validation = await api.validateConnection();
        result = { success: validation.success, message: validation.error || "Conexão validada com sucesso" };
      } else if (provider === "infobip") {
        const api = createInfobipApi({
          base_url: infobip.base_url,
          api_key: infobip.api_key,
          from: infobip.from
        });
        
        const validation = await api.validateConnection();
        result = { success: validation.success, message: validation.error || "Conexão validada com sucesso" };
      } else if (provider === "gupshup") {
        const api = createGupshupApi({
          api_key: gupshup.api_key,
          app: gupshup.app,
          source: gupshup.source,
          environment: gupshup.environment
        });
        
        const validation = await api.validateConnection();
        result = { success: validation.success, message: validation.error || "Conexão validada com sucesso" };
      }
      
      setConnOk(result.success);
      setConnMsg(result.message);
    } catch (error) {
      setConnOk(false);
      setConnMsg(error instanceof Error ? error.message : "Erro na validação");
    }
  };

  const checkQualityTier = async () => {
    if (provider !== "meta" || !selectedWaba) {
      toast({ title: "Erro", description: "Função disponível apenas para Meta Cloud", variant: "destructive" });
      return;
    }
    
    try {
      const selectedWabaData = wabas.find(w => w.id === selectedWaba);
      if (!selectedWabaData) return;
      
      // For now, use placeholder token - should get from secure credentials
      const api = createMetaApi({
        access_token: "placeholder_token",
        waba_id: selectedWabaData.waba_id,
        phone_number_id: meta.phone_number_id,
        graph_version: meta.graph_version
      });
      
      const result = await api.checkQualityTier();
      if (result.success && result.data) {
        setQuality(result.data.quality_rating as any);
        setTier(result.data.messaging_limit_tier);
        toast({ 
          title: "Qualidade/Tier obtida", 
          description: `${result.data.quality_rating} · Tier ${result.data.messaging_limit_tier}` 
        });
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao obter qualidade/tier", variant: "destructive" });
    }
  };

  const syncTemplates = async () => {
    try {
      let result = { success: false, templates: [], stats: { approved: 0, pending: 0, rejected: 0 } };
      
      if (provider === "meta") {
        const selectedWabaData = wabas.find(w => w.id === selectedWaba);
        if (!selectedWabaData) {
          throw new Error("WABA não selecionada");
        }
        
        // For now, use placeholder token - should get from secure credentials
        const api = createMetaApi({
          access_token: "placeholder_token",
          waba_id: selectedWabaData.waba_id,
          phone_number_id: meta.phone_number_id,
          graph_version: meta.graph_version
        });
        
        const syncResult = await api.syncTemplates();
        if (syncResult.success && syncResult.data) {
          result = { success: true, templates: syncResult.data.templates, stats: syncResult.data.stats };
        } else {
          throw new Error(syncResult.error || "Falha na sincronização");
        }
      } else if (provider === "infobip") {
        const api = createInfobipApi({
          base_url: infobip.base_url,
          api_key: infobip.api_key,
          from: infobip.from
        });
        
        const syncResult = await api.syncTemplates();
        if (syncResult.success && syncResult.data) {
          result = { success: true, templates: syncResult.data.templates, stats: syncResult.data.stats };
        } else {
          throw new Error(syncResult.error || "Falha na sincronização");
        }
      } else if (provider === "gupshup") {
        const api = createGupshupApi({
          api_key: gupshup.api_key,
          app: gupshup.app,
          source: gupshup.source,
          environment: gupshup.environment
        });
        
        const syncResult = await api.syncTemplates();
        if (syncResult.success && syncResult.data) {
          result = { success: true, templates: syncResult.data.templates, stats: syncResult.data.stats };
        } else {
          throw new Error(syncResult.error || "Falha na sincronização");
        }
      }
      
      setTplStats(result.stats);
      setTplSyncOk(result.success);
      toast({ 
        title: "Templates sincronizados", 
        description: `${result.stats.approved} aprovados, ${result.stats.pending} pendentes, ${result.stats.rejected} rejeitados.`
      });
    } catch (error) {
      setTplSyncOk(false);
      toast({ 
        title: "Erro na sincronização", 
        description: error instanceof Error ? error.message : "Falha ao sincronizar templates",
        variant: "destructive" 
      });
    }
  };

  const [savedPhoneNumber, setSavedPhoneNumber] = React.useState<any>(null);
  const [webhookValidating, setWebhookValidating] = React.useState(false);

  const validateWebhook = async () => {
    if (!savedPhoneNumber) {
      toast({ title: "Erro", description: "Salve o número primeiro", variant: "destructive" });
      return;
    }

    setWebhookValidating(true);
    
    try {
      const response = await supabase.functions.invoke('validate-webhook', {
        body: { 
          phoneNumberId: savedPhoneNumber.id,
          workspaceId: activeWorkspace.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { webhookConfigured, canReceiveMessages, message, instructions } = response.data;
      
      setWebhookOk(webhookConfigured);
      
      if (webhookConfigured) {
        toast({ 
          title: "Webhook verificado", 
          description: message
        });
      } else {
        toast({ 
          title: "Falha na verificação", 
          description: message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Webhook validation error:', error);
      toast({ 
        title: "Erro na verificação", 
        description: error instanceof Error ? error.message : "Falha ao verificar webhook",
        variant: "destructive" 
      });
      setWebhookOk(false);
    } finally {
      setWebhookValidating(false);
    }
  };

  const handleSave = async () => {
    if (!connOk || !tplSyncOk || !activeWorkspace) {
      toast({ title: "Validação necessária", description: "Complete todas as verificações antes de salvar.", variant: "destructive" });
      return;
    }

    try {
      const wabaRef = provider === "meta" ? selectedWaba : undefined;
      if (provider === "meta" && !wabaRef) {
        throw new Error("WABA deve ser selecionada para Meta Cloud");
      }

      const phoneNumberData = {
        display_number: phoneE164,
        phone_number_id: provider === "meta" ? meta.phone_number_id : phoneE164,
        waba_ref: wabaRef || "",
        workspace_id: activeWorkspace.id,
        mps_target: tps,
        quality_rating: quality,
        status: "ACTIVE" as const
      };

      const savedNumber = await savePhoneNumber(phoneNumberData);
      setSavedPhoneNumber(savedNumber);
      
      if (savedNumber) {
        // Criar objeto compatível com ExtendedNumber para o callback
        const mapped: ExtendedNumber = {
          id: savedNumber.id,
          label,
          provider,
          status: "ACTIVE",
          quality,
          tps,
          phoneE164,
          usage: (usage || undefined) as any,
          pools: pools.length ? pools : undefined,
          canFallback,
          wabaId: provider === "meta" ? meta.waba_id : undefined,
          phoneId: provider === "meta" ? meta.phone_number_id : undefined,
          meta: provider === "meta" ? meta : undefined,
          infobip: provider === "infobip" ? infobip : undefined,
          gupshup: provider === "gupshup" ? gupshup : undefined,
          utilityTemplates: [],
        } as ExtendedNumber;

        onSave(mapped);
        resetAll();
        onOpenChange(false);
      }
    } catch (error) {
      toast({ 
        title: "Erro ao salvar", 
        description: error instanceof Error ? error.message : "Falha ao salvar número",
        variant: "destructive" 
      });
    }
  };

  const togglePool = (p: string) => {
    setPools((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep(1); } }}>
      <DialogContent className="max-w-3xl">
        <TooltipProvider>
        <DialogHeader>
          <DialogTitle>Novo número · Wizard (3 passos)</DialogTitle>
        </DialogHeader>

        {/* Stepper simples */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={step === 1 ? "default" : "secondary"}>1</Badge>
          <span>Provedor & Identificação</span>
          <span className="opacity-50">/</span>
          <Badge variant={step === 2 ? "default" : "secondary"}>2</Badge>
          <span>Credenciais específicas</span>
          <span className="opacity-50">/</span>
          <Badge variant={step === 3 ? "default" : "secondary"}>3</Badge>
          <span>Verificações & Sync</span>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <div className="flex items-center gap-1">
                <Label>Label (3–40)</Label>
                <HelpHint text="Apelido exibido no console. 3–40 caracteres. Ex.: Sender-01 BR." />
              </div>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Sender-01 BR" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label>Número (E.164)</Label>
                <HelpHint text="Número completo no formato E.164. Ex.: +5511998765432. Sem espaços, parênteses ou traços." />
              </div>
              <Input value={phoneE164} onChange={(e) => setPhoneE164(e.target.value.replace(/[^+\d]/g, ""))} placeholder="+5511998765432" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label>Provedor/BSP</Label>
                <HelpHint text="Selecione o provedor de envio: Meta Cloud, Infobip ou Gupshup." />
              </div>
              <Select value={provider} onValueChange={(v: Provider) => setProvider(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta Cloud (direto)</SelectItem>
                  <SelectItem value="infobip">Infobip</SelectItem>
                  <SelectItem value="gupshup">Gupshup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label>Uso preferencial</Label>
                <HelpHint text="Ajuda no roteamento. Opcional: Marketing, Transacional ou Ambos." />
              </div>
              <Select value={usage} onValueChange={(v: any) => setUsage(v)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="transacional">Transacional</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label>TPS alvo (≥ 1)</Label>
                <HelpHint text="Mensagens por segundo desejadas (≥ 1). Usado pelo scheduler/quota." />
              </div>
              <Input type="number" value={tps} min={1} onChange={(e) => setTps(Math.max(1, Number(e.target.value || 1)))} />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-1">
                <Label>Entrar neste Pool</Label>
                <HelpHint text="Opcional: inclua o número em Pools (ex.: Pool Marketing BR) para roteamento/failover." />
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {POOLS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePool(p)}
                    className={cn("border rounded-md px-3 py-2 text-left hover:bg-muted", pools.includes(p) && "bg-muted")}
                    aria-pressed={pools.includes(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch checked={canFallback} onCheckedChange={setCanFallback} />
              <span>Marcar como “pode ser fallback”</span><HelpHint text="Se ativo, este número pode ser usado como fallback quando outro falhar." />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Rascunho enviado ao backend (simulado)</Label>
                <HelpHint text="Exemplo do payload parcial enviado ao backend ao final do Passo 1." />
              </div>
              <pre className="mt-1 rounded-md bg-muted p-3 text-xs overflow-auto">
{JSON.stringify({
  label,
  phone_e164: phoneE164,
  provider,
  tps,
  usage: usage || undefined,
  pools: pools.length ? pools : undefined,
}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-2 space-y-4">
            <Tabs defaultValue={provider} value={provider} onValueChange={(v: Provider) => setProvider(v)}>
              <TabsList>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="infobip">Infobip</TabsTrigger>
                <TabsTrigger value="gupshup">Gupshup</TabsTrigger>
              </TabsList>

              <TabsContent value="meta" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><div className="flex items-center gap-1"><Label>WABA ID</Label><HelpHint text="ID da WhatsApp Business Account (12–16 dígitos). Encontre no Meta Business Manager > Business Settings > WhatsApp Accounts." /></div><Input value={meta.waba_id} onChange={(e) => setMeta({ ...meta, waba_id: e.target.value })} placeholder="123456789012345" /></div>
                  <div><div className="flex items-center gap-1"><Label>Phone Number ID</Label><HelpHint text="ID do número na Graph API. Veja em WhatsApp Manager (Detalhes do número) ou via Graph Explorer." /></div><Input value={meta.phone_number_id} onChange={(e) => setMeta({ ...meta, phone_number_id: e.target.value })} placeholder="987654321098765" /></div>
                  <div className="md:col-span-2"><div className="flex items-center gap-1"><Label>Access Token</Label><HelpHint text="Token (System User/long-lived) com escopos whatsapp_business_messaging e whatsapp_business_management." /></div><Input value={meta.access_token} onChange={(e) => setMeta({ ...meta, access_token: e.target.value })} placeholder="EAAG..." /></div>
                  <div><div className="flex items-center gap-1"><Label>Graph API Version</Label><HelpHint text="Versão da Graph API usada nas chamadas (ex.: v19.0)." /></div><Input value={meta.graph_version} onChange={(e) => setMeta({ ...meta, graph_version: e.target.value })} placeholder="v19.0" /></div>
                  <div><div className="flex items-center gap-1"><Label>App ID (opcional)</Label><HelpHint text="ID do App Meta (útil para diagnóstico)." /></div><Input value={meta.app_id} onChange={(e) => setMeta({ ...meta, app_id: e.target.value })} placeholder="1234567890" /></div>
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-1">
                      <Label>WABA Configurada</Label>
                      <HelpHint text="Selecione a WABA já configurada na aba de credenciais." />
                    </div>
                    <Select value={selectedWaba} onValueChange={setSelectedWaba}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma WABA" /></SelectTrigger>
                      <SelectContent>
                        {wabas.map(waba => (
                          <SelectItem key={waba.id} value={waba.id}>
                            {waba.name || waba.waba_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={testConnection}>Testar credenciais</Button>
                  <Button size="sm" variant="secondary" onClick={checkQualityTier}>Checar qualidade/tier</Button>
                  <Button size="sm" variant="outline" onClick={syncTemplates}>Sincronizar templates</Button>
                </div>
              </TabsContent>

              <TabsContent value="infobip" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><div className="flex items-center gap-1"><Label>Base URL</Label><HelpHint text="URL da sua instância: https://<cluster>.api.infobip.com." /></div><Input value={infobip.base_url} onChange={(e) => setInfobip({ ...infobip, base_url: e.target.value })} placeholder="https://XYZ123.api.infobip.com" /></div>
                  <div className="md:col-span-2"><div className="flex items-center gap-1"><Label>API Key</Label><HelpHint text="Chave do portal Infobip (Applications). 32–64 caracteres. Header: Authorization: App <key>." /></div><Input value={infobip.api_key} onChange={(e) => setInfobip({ ...infobip, api_key: e.target.value })} placeholder="abcdef123456..." /></div>
                  <div><div className="flex items-center gap-1"><Label>From (número)</Label><HelpHint text="Remetente sem +, 10–15 dígitos (ex.: 5511998765432)." /></div><Input value={infobip.from} onChange={(e) => setInfobip({ ...infobip, from: e.target.value.replace(/\D/g, "") })} placeholder="5511998765432" /></div>
                  <div><div className="flex items-center gap-1"><Label>DLR Secret (opcional)</Label><HelpHint text="Opcional. Segredo para validar assinaturas de DLR." /></div><Input value={infobip.dlr_secret} onChange={(e) => setInfobip({ ...infobip, dlr_secret: e.target.value })} placeholder="opcional" /></div>
                  <div><div className="flex items-center gap-1"><Label>Inbound Secret (opcional)</Label><HelpHint text="Opcional. Segredo para validar mensagens recebidas." /></div><Input value={infobip.inbound_secret} onChange={(e) => setInfobip({ ...infobip, inbound_secret: e.target.value })} placeholder="opcional" /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={testConnection}>Testar conexão</Button>
                  <Button size="sm" variant="outline" onClick={syncTemplates}>Sincronizar templates</Button>
                </div>
              </TabsContent>

              <TabsContent value="gupshup" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><div className="flex items-center gap-1"><Label>API Key</Label><HelpHint text="Chave da conta. Usada no header 'apikey'." /></div><Input value={gupshup.api_key} onChange={(e) => setGupshup({ ...gupshup, api_key: e.target.value })} placeholder="api_xxx" /></div>
                  <div><div className="flex items-center gap-1"><Label>App</Label><HelpHint text="Nome/ID do app WhatsApp na sua conta." /></div><Input value={gupshup.app} onChange={(e) => setGupshup({ ...gupshup, app: e.target.value })} placeholder="meu_app_whatsapp" /></div>
                  <div><div className="flex items-center gap-1"><Label>Source (número)</Label><HelpHint text="Número remetente sem +, 10–15 dígitos." /></div><Input value={gupshup.source} onChange={(e) => setGupshup({ ...gupshup, source: e.target.value.replace(/\D/g, "") })} placeholder="5511998765432" /></div>
                  <div><div className="flex items-center gap-1"><Label>Callback Secret (opcional)</Label><HelpHint text="Opcional. Segredo para validar callbacks." /></div><Input value={gupshup.callback_secret} onChange={(e) => setGupshup({ ...gupshup, callback_secret: e.target.value })} placeholder="opcional" /></div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Label>Ambiente</Label>
                      <HelpHint text="Selecione Live ou Sandbox conforme o app." />
                    </div>
                    <Select value={gupshup.environment} onValueChange={(v: any) => setGupshup({ ...gupshup, environment: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={testConnection}>Testar conexão</Button>
                  <Button size="sm" variant="outline" onClick={syncTemplates}>Sincronizar templates</Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* feedback rápido */}
            <div className="text-sm space-y-1">
              {connOk !== null && <p>Conexão: {connOk ? "✅" : "❌"} {connMsg}</p>}
              {tplSyncOk !== null && <p>Templates: {tplSyncOk ? "✅ sincronizado" : "—"}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-md border">
                <p className="font-medium">Conexão</p>
                <p className="text-sm mt-1">{connOk === null ? "—" : connOk ? "✅ OK" : "❌ Falhou"} {connMsg}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={testConnection}>Re-testar</Button>
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium">Webhooks</p>
                <p className="text-sm mt-1">{webhookOk === null ? "⚠️ Pendente" : webhookOk ? "✅ Verificado" : "⚠️ Pendente"}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={validateWebhook}>Verificar webhook</Button>
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium">Templates disponíveis</p>
                <p className="text-sm mt-1">Aprovados: {tplStats.approved} · Pendente: {tplStats.pending} · Rejeitados: {tplStats.rejected}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={syncTemplates}>Sincronizar novamente</Button>
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium">Qualidade & Tier</p>
                <p className="text-sm mt-1">{quality} | Tier {tier}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={checkQualityTier}>Checar</Button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-md border">
              <p className="font-medium">Cobertura de templates-chave</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>promo_pt_BR — <b>OK</b></li>
                <li>otp_pt_BR — <b>OK</b></li>
                <li>atualizacao_pedido_pt_BR — <b>FALTA</b></li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">Etapa {step} de 3</div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as any)}>Voltar</Button>
            )}
            {step < 3 && (
              <Button onClick={() => step === 1 ? setStep(2) : setStep(3)} disabled={step === 1 && !canNext1()}>
                Avançar
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSave} disabled={!connOk || !tplSyncOk}>Salvar & ativar</Button>
            )}
          </div>
        </DialogFooter>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
