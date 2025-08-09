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
import type { ExtendedNumber } from "./NumbersIntegration";
import { cn } from "@/lib/utils";

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

  // Passo 1 — comum
  const [label, setLabel] = React.useState("");
  const [phoneE164, setPhoneE164] = React.useState("");
  const [provider, setProvider] = React.useState<Provider>("meta");
  const [usage, setUsage] = React.useState<Usage | "">("");
  const [tps, setTps] = React.useState<number>(10);
  const [pools, setPools] = React.useState<string[]>([]);
  const [canFallback, setCanFallback] = React.useState<boolean>(true);

  // Passo 2 — específicos
  const [meta, setMeta] = React.useState({
    waba_id: "",
    phone_number_id: "",
    access_token: "",
    graph_version: "v19.0",
    app_id: "",
    webhook_verify_token: "",
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
    setMeta({ waba_id: "", phone_number_id: "", access_token: "", graph_version: "v19.0", app_id: "", webhook_verify_token: "" });
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
    await new Promise((r) => setTimeout(r, 800));
    // regra simples de validação local
    let ok = false;
    if (provider === "meta") ok = !!(meta.waba_id.match(/^\d{12,16}$/) && meta.phone_number_id && meta.access_token);
    if (provider === "infobip") ok = /^https:\/\/.*\.api\.infobip\.com$/i.test(infobip.base_url) && infobip.api_key.length >= 32 && /\d{10,15}/.test(infobip.from);
    if (provider === "gupshup") ok = !!(gupshup.api_key && gupshup.app && /\d{10,15}/.test(gupshup.source));
    setConnOk(ok);
    setConnMsg(ok ? "Conexão validada (200 OK simulado)." : "Falha de conexão: verifique os campos.");
  };

  const checkQualityTier = async () => {
    await new Promise((r) => setTimeout(r, 500));
    setQuality("HIGH");
    setTier("10k");
    toast({ title: "Qualidade/Tier", description: "HIGH · Tier 10k (simulado)" });
  };

  const syncTemplates = async () => {
    await new Promise((r) => setTimeout(r, 900));
    setTplStats({ approved: 23, pending: 2, rejected: 1 });
    setTplSyncOk(true);
    toast({ title: "Templates sincronizados", description: "Catálogo atualizado (simulado)." });
  };

  const resendWebhook = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setWebhookOk(true);
    toast({ title: "Webhook verificado", description: "Assinatura verificada (simulado)." });
  };

  const handleSave = () => {
    if (!connOk || !tplSyncOk) return;
    const id = `num_${Date.now()}`;

    const mapped: ExtendedNumber = {
      id,
      label,
      provider,
      status: "ACTIVE",
      quality,
      tps,
      // campos extras capturados pelo wizard
      phoneE164,
      usage: (usage || undefined) as any,
      pools: pools.length ? pools : undefined,
      canFallback,
      // provider specifics (mantidos para futura edição)
      wabaId: provider === "meta" ? meta.waba_id : undefined,
      phoneId: provider === "meta" ? meta.phone_number_id : undefined,
      meta: provider === "meta" ? meta : undefined,
      infobip: provider === "infobip" ? infobip : undefined,
      gupshup: provider === "gupshup" ? gupshup : undefined,
      utilityTemplates: [],
    } as ExtendedNumber;

    onSave(mapped);
    toast({ title: "Número salvo & ativado", description: "Persistido localmente (frontend)." });
    resetAll();
  };

  const togglePool = (p: string) => {
    setPools((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep(1); } }}>
      <DialogContent className="max-w-3xl">
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
              <Label>Label (3–40)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Sender-01 BR" />
            </div>
            <div>
              <Label>Número (E.164)</Label>
              <Input value={phoneE164} onChange={(e) => setPhoneE164(e.target.value.replace(/[^+\d]/g, ""))} placeholder="+5511998765432" />
            </div>
            <div>
              <Label>Provedor/BSP</Label>
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
              <Label>Uso preferencial</Label>
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
              <Label>TPS alvo (≥ 1)</Label>
              <Input type="number" value={tps} min={1} onChange={(e) => setTps(Math.max(1, Number(e.target.value || 1)))} />
            </div>
            <div className="md:col-span-2">
              <Label>Entrar neste Pool</Label>
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
              <span>Marcar como “pode ser fallback”</span>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Rascunho enviado ao backend (simulado)</Label>
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
                  <div><Label>WABA ID</Label><Input value={meta.waba_id} onChange={(e) => setMeta({ ...meta, waba_id: e.target.value })} placeholder="123456789012345" /></div>
                  <div><Label>Phone Number ID</Label><Input value={meta.phone_number_id} onChange={(e) => setMeta({ ...meta, phone_number_id: e.target.value })} placeholder="987654321098765" /></div>
                  <div className="md:col-span-2"><Label>Access Token</Label><Input value={meta.access_token} onChange={(e) => setMeta({ ...meta, access_token: e.target.value })} placeholder="EAAG..." /></div>
                  <div><Label>Graph API Version</Label><Input value={meta.graph_version} onChange={(e) => setMeta({ ...meta, graph_version: e.target.value })} placeholder="v19.0" /></div>
                  <div><Label>App ID (opcional)</Label><Input value={meta.app_id} onChange={(e) => setMeta({ ...meta, app_id: e.target.value })} placeholder="1234567890" /></div>
                  <div className="md:col-span-2"><Label>Webhook Verify Token</Label><Input value={meta.webhook_verify_token} onChange={(e) => setMeta({ ...meta, webhook_verify_token: e.target.value })} placeholder="minha-chave-webhook" /></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={testConnection}>Testar credenciais</Button>
                  <Button size="sm" variant="secondary" onClick={checkQualityTier}>Checar qualidade/tier</Button>
                  <Button size="sm" variant="outline" onClick={syncTemplates}>Sincronizar templates</Button>
                </div>
              </TabsContent>

              <TabsContent value="infobip" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><Label>Base URL</Label><Input value={infobip.base_url} onChange={(e) => setInfobip({ ...infobip, base_url: e.target.value })} placeholder="https://XYZ123.api.infobip.com" /></div>
                  <div className="md:col-span-2"><Label>API Key</Label><Input value={infobip.api_key} onChange={(e) => setInfobip({ ...infobip, api_key: e.target.value })} placeholder="abcdef123456..." /></div>
                  <div><Label>From (número)</Label><Input value={infobip.from} onChange={(e) => setInfobip({ ...infobip, from: e.target.value.replace(/\D/g, "") })} placeholder="5511998765432" /></div>
                  <div><Label>DLR Secret (opcional)</Label><Input value={infobip.dlr_secret} onChange={(e) => setInfobip({ ...infobip, dlr_secret: e.target.value })} placeholder="opcional" /></div>
                  <div><Label>Inbound Secret (opcional)</Label><Input value={infobip.inbound_secret} onChange={(e) => setInfobip({ ...infobip, inbound_secret: e.target.value })} placeholder="opcional" /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={testConnection}>Testar conexão</Button>
                  <Button size="sm" variant="outline" onClick={syncTemplates}>Sincronizar templates</Button>
                </div>
              </TabsContent>

              <TabsContent value="gupshup" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><Label>API Key</Label><Input value={gupshup.api_key} onChange={(e) => setGupshup({ ...gupshup, api_key: e.target.value })} placeholder="api_xxx" /></div>
                  <div><Label>App</Label><Input value={gupshup.app} onChange={(e) => setGupshup({ ...gupshup, app: e.target.value })} placeholder="meu_app_whatsapp" /></div>
                  <div><Label>Source (número)</Label><Input value={gupshup.source} onChange={(e) => setGupshup({ ...gupshup, source: e.target.value.replace(/\D/g, "") })} placeholder="5511998765432" /></div>
                  <div><Label>Callback Secret (opcional)</Label><Input value={gupshup.callback_secret} onChange={(e) => setGupshup({ ...gupshup, callback_secret: e.target.value })} placeholder="opcional" /></div>
                  <div><Label>Ambiente</Label>
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
                  <Button size="sm" variant="secondary" onClick={resendWebhook}>Reenviar verificação</Button>
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
      </DialogContent>
    </Dialog>
  );
}
