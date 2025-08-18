import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOpsTabs } from "@/context/OpsTabsContext";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { useToast } from "@/hooks/use-toast";

import CascadePolicyEditor, { CascadePolicyConfig, defaultCascadePolicyConfig } from "@/components/campaigns/CascadePolicyEditor";

export default function CampaignCreate() {
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string>("");
  const [autoBalance, setAutoBalance] = useState(true);
  const [tps, setTps] = useState<number[]>([20]);
  const [cascadeConfig, setCascadeConfig] = useState<CascadePolicyConfig>(defaultCascadePolicyConfig);

  // Farm models
  const [farmModel, setFarmModel] = useState<"none" | "1k" | "10k" | "100k">("none");
  const [totalTarget, setTotalTarget] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);

  const navigate = useNavigate();
  const { openTab } = useOpsTabs();
  const { createCampaign } = useCampaigns();
  const { contactLists: audiences } = useContacts();
  const { phoneNumbers } = usePhoneNumbers();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as "template" | "session" | "farm") ?? "template";
  const [campaignType, setCampaignType] = useState<"template" | "session" | "farm">(initialType);

  useEffect(() => {
    document.title = campaignType === "farm" ? "Nova Campanha – Farm de Números | Console" : "Nova Campanha | Console";
  }, [campaignType]);

  const syncCascadeFromAlloc = (ids: string[], alloc: Record<string, number>) => {
    setCascadeConfig((c) => ({
      ...c,
      numbers_order: ids,
      number_quotas: ids.reduce((acc, id) => ({ ...acc, [id]: alloc[id] ?? 0 }), {} as Record<string, number>),
    }));
  };

  const toggleNumber = (id: string) => {
    setSelectedIds((curr) => {
      const exists = curr.includes(id);
      if (exists) {
        const nextIds = curr.filter((x) => x !== id);
        setAllocations((prev) => {
          const { [id]: _drop, ...rest } = prev;
          syncCascadeFromAlloc(nextIds, rest);
          return rest;
        });
        return nextIds;
      }
      if (curr.length >= 10) return curr; // máximo 10
      const nextIds = [...curr, id];
      // redistribui se já houver meta total
      if (totalTarget > 0) {
        const base = Math.floor(totalTarget / nextIds.length);
        const rem = totalTarget % nextIds.length;
        const nextAlloc: Record<string, number> = {};
        nextIds.forEach((nid, i) => (nextAlloc[nid] = base + (i < rem ? 1 : 0)));
        setAllocations(nextAlloc);
        syncCascadeFromAlloc(nextIds, nextAlloc);
      }
      return nextIds;
    });
  };

  const equalizeAlloc = () => {
    if (selectedIds.length === 0 || totalTarget <= 0) return;
    const base = Math.floor(totalTarget / selectedIds.length);
    const rem = totalTarget % selectedIds.length;
    const nextAlloc: Record<string, number> = {};
    selectedIds.forEach((id, i) => (nextAlloc[id] = base + (i < rem ? 1 : 0)));
    setAllocations(nextAlloc);
    syncCascadeFromAlloc(selectedIds, nextAlloc);
  };

  const applyModel = (model: "1k" | "10k" | "100k") => {
    setFarmModel(model);
    const vol = model === "1k" ? 1000 : model === "10k" ? 10000 : 100000;
    setTotalTarget(vol);
    if (selectedIds.length > 0) {
      const base = Math.floor(vol / selectedIds.length);
      const rem = vol % selectedIds.length;
      const nextAlloc: Record<string, number> = {};
      selectedIds.forEach((id, i) => (nextAlloc[id] = base + (i < rem ? 1 : 0)));
      setAllocations(nextAlloc);
      syncCascadeFromAlloc(selectedIds, nextAlloc);
    }
  };
  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const launch = async () => {
    if (!campaignName.trim()) {
      toast({ title: "Erro", description: "Nome da campanha é obrigatório.", variant: "destructive" });
      return;
    }

    try {
      const campaign = await createCampaign(
        campaignName,
        "", // workspaceId will be set in hook
        selectedAudience || undefined,
        campaignType === "template" ? "MARKETING" : "UTILITY"
      );

      const path = `/campaigns/${campaign.id}/console`;
      openTab({ 
        id: campaign.id, 
        type: "campaign", 
        title: `Campanha ${campaignName}`, 
        status: "Running", 
        path 
      });
      navigate(path);
      
      toast({ title: "Sucesso", description: "Campanha criada com sucesso!" });
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha ao criar campanha.", 
        variant: "destructive" 
      });
    }
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
                  <Input 
                    placeholder="Black Friday 2025" 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={campaignType} onValueChange={(v) => setCampaignType(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="session">Sessão</SelectItem>
                      <SelectItem value="farm">Farm de Números</SelectItem>
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

              {/* Modelos de Farm e distribuição */}
              {campaignType === "farm" && (
              <div className="rounded-md border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modelos de Farm</Label>
                    <p className="text-xs text-muted-foreground">Selecione um preset de volume e distribua entre até 10 números.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={farmModel === "1k" ? "default" : "outline"} size="sm" onClick={() => applyModel("1k")}>1.000</Button>
                    <Button variant={farmModel === "10k" ? "default" : "outline"} size="sm" onClick={() => applyModel("10k")}>10.000</Button>
                    <Button variant={farmModel === "100k" ? "default" : "outline"} size="sm" onClick={() => applyModel("100k")}>100.000</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setFarmModel("none"); setTotalTarget(0); setAllocations({}); setSelectedIds([]); }}>Limpar</Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Escolha até 10 números <span className="text-xs text-muted-foreground">({selectedIds.length}/10)</span></Label>
                    <div className="rounded-md border divide-y">
                      {phoneNumbers.map((n) => {
                        const checked = selectedIds.includes(n.id);
                        const disabled = !checked && selectedIds.length >= 10;
                        return (
                          <label key={n.id} className={`flex items-center justify-between p-2 ${disabled ? "opacity-50" : ""}`}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={checked} onCheckedChange={() => toggleNumber(n.id)} disabled={disabled} />
                              <div>
                                <div className="font-medium">{n.display_number}</div>
                                <div className="text-xs text-muted-foreground">Qualidade {n.quality_rating} • {n.status}</div>
                              </div>
                            </div>
                            {checked && (
                              <div className="w-28">
                                <Label className="text-xs">Cota (msgs)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={allocations[n.id] ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value || 0);
                                    const next = { ...allocations, [n.id]: val } as Record<string, number>;
                                    setAllocations(next);
                                    syncCascadeFromAlloc(selectedIds, next);
                                  }}
                                />
                              </div>
                            )}
                          </label>
                        );
                      })}
                      {phoneNumbers.length === 0 && <div className="p-2 text-sm text-muted-foreground">Sem números disponíveis</div>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Meta total de envios</Label>
                      <Input
                        type="number"
                        min={0}
                        value={totalTarget}
                        onChange={(e) => setTotalTarget(Number(e.target.value || 0))}
                        placeholder="ex.: 10000"
                      />
                      <div className="text-xs text-muted-foreground mt-1">Distribua manualmente ou use Equalizar.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={equalizeAlloc} disabled={selectedIds.length === 0 || totalTarget <= 0}>Equalizar</Button>
                      <div className="text-sm text-muted-foreground">Alocado: {totalAllocated} / {totalTarget}</div>
                    </div>
                  </div>
                </div>
              </div>
              )}


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
                  <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma lista" /></SelectTrigger>
                    <SelectContent>
                      {audiences.map((audience) => (
                        <SelectItem key={audience.id} value={audience.id}>
                          {audience.name} ({audience.total} contatos)
                        </SelectItem>
                      ))}
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
                  <div className="text-sm">
                    {selectedIds.length > 0 && totalAllocated > 0
                      ? selectedIds
                          .filter((id) => (allocations[id] ?? 0) > 0)
                          .map((id) => {
                            const meta = phoneNumbers.find((n) => n.id === id);
                            const pct = Math.round(((allocations[id] ?? 0) / totalAllocated) * 100);
                            return `${meta?.display_number ?? id} ${pct}%`;
                          })
                          .join(" · ")
                      : "Números configurados automaticamente"}
                  </div>
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
