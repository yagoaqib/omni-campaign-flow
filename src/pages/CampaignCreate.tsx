import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOpsTabs } from "@/context/OpsTabsContext";

import CascadePolicyEditor, { CascadePolicyConfig, defaultCascadePolicyConfig } from "@/components/campaigns/CascadePolicyEditor";

export default function CampaignCreate() {
  const [step, setStep] = useState(1);
  const [autoBalance, setAutoBalance] = useState(true);
  const [tps, setTps] = useState<number[]>([20]);
  const [cascadeConfig, setCascadeConfig] = useState<CascadePolicyConfig>(defaultCascadePolicyConfig);
  const navigate = useNavigate();
  const { openTab } = useOpsTabs();

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const launch = () => {
    const id = String(Date.now());
    const path = `/campaigns/${id}/console`;
    openTab({ id, type: "campaign", title: `Campanha ${id.slice(-4)}`, status: "Running", path });
    navigate(path);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nova Campanha</h1>
          <p className="text-muted-foreground">Wizard simplificado em 4 passos.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[1,2,3,4].map((n) => (
            <div key={n} className={`h-2 flex-1 rounded ${n <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input placeholder="Black Friday 2025" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select defaultValue="template">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="session">Sessão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Provedor primário</Label>
                  <Select defaultValue="infobip">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infobip">Infobip</SelectItem>
                      <SelectItem value="gupshup">Gupshup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Fallback Gupshup</Label>
                    <p className="text-xs text-muted-foreground">Usar fallback automaticamente</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Balanceamento automático</Label>
                    <Switch checked={autoBalance} onCheckedChange={(v) => setAutoBalance(!!v)} />
                  </div>
                  <div>
                    <Label>TPS global</Label>
                    <Slider value={tps} onValueChange={setTps} max={100} step={1} />
                    <div className="text-sm text-muted-foreground mt-1">{tps[0]} TPS</div>
                  </div>
                </div>
                <div>
                  <Label>Pool</Label>
                  <Select defaultValue="pool-br">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool-br">Pool Marketing BR (3 números)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">Alocação prevista por sender mostrada ao lançar.</p>
                </div>
              </div>

              <div className="pt-4">
                <CascadePolicyEditor value={cascadeConfig} onChange={setCascadeConfig} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Template</Label>
                  <Select defaultValue="promo">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promo">Promo BR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idioma</Label>
                  <Select defaultValue="pt_BR">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt_BR">pt_BR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Variáveis</Label>
                <Input placeholder="{{1}} = nome, {{2}} = desconto" />
                <p className="text-xs text-muted-foreground mt-1">Validação inline será aplicada aqui.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Público</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Listas</Label>
                  <Select defaultValue="lista1">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lista1">Clientes BR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Number Lookup</Label>
                    <p className="text-xs text-muted-foreground">Verificar WhatsApp antes de enviar</p>
                  </div>
                  <Switch />
                </div>
                <div>
                  <Label>Baixar inválidos</Label>
                  <Button variant="outline" className="w-full">Exportar CSV</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Envio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Estimativa de custo</div>
                  <div className="text-xl font-semibold">R$ 1.245,30</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Alocação prevista</div>
                  <div className="text-sm">Sender-01 50% · Sender-02 30% · Sender-03 20%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Alertas</div>
                  <div className="text-sm">Tier 90% no Sender-02</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Configuração de Cascata (JSON)</div>
                <pre className="text-xs rounded-md border p-3 bg-muted/30 overflow-auto">{JSON.stringify(cascadeConfig, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 1}>Voltar</Button>
          {step < 4 ? (
            <Button onClick={next}>Próximo</Button>
          ) : (
            <Button onClick={launch}>Lançar</Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
