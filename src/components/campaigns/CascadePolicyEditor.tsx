import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import * as React from "react";
import { GripVertical } from "lucide-react";
import { useAvailableNumbers } from "@/hooks/useAvailableNumbers";

export type MinQuality = "HIGH" | "MEDIUM" | "LOW";
export type DesiredCategory = "UTILITY" | "MARKETING";

export type CategoryChangeBehavior = "SWAP_TEMPLATE_SAME_NUMBER" | "MOVE_TO_NEXT_NUMBER";

export type PerNumberConfig = {
  wabaId?: string;
  phoneNumberId?: string;
  mpsTarget?: number;
  util_stack?: string[];
  mkt_stack?: string[];
};

export type CascadePolicyRules = {
  progressOnlyOnQualityDrop: boolean;
  categoryChangeBehavior: CategoryChangeBehavior;
};

export type CascadePolicyConfig = {
  numbers_order: string[];
  number_quotas: Record<string, number>;
  min_quality: MinQuality;
  template_stack_util: string[];
  template_stack_mkt: string[];
  desired_category: DesiredCategory;
  retry: { max: number; backoffSec: number };
  per_number: Record<string, PerNumberConfig>;
  rules: CascadePolicyRules;
};

export const defaultCascadePolicyConfig: CascadePolicyConfig = {
  numbers_order: ["num_A", "num_B", "num_C"],
  number_quotas: { num_A: 1000, num_B: 1000, num_C: 1000 },
  min_quality: "HIGH",
  template_stack_util: ["util_1", "util_2"],
  template_stack_mkt: [],
  desired_category: "UTILITY",
  retry: { max: 3, backoffSec: 10 },
  per_number: {
    num_A: { mpsTarget: 80, util_stack: [] },
    num_B: { mpsTarget: 80, util_stack: [] },
    num_C: { mpsTarget: 80, util_stack: [] },
  },
  rules: {
    progressOnlyOnQualityDrop: true,
    categoryChangeBehavior: "SWAP_TEMPLATE_SAME_NUMBER",
  },
};

// Números agora vêm do Pool real (src/data/numbersPool.ts)

function QualityBadge({ q }: { q: MinQuality }) {
  const tone = q === "HIGH" ? "default" : q === "MEDIUM" ? "secondary" : "outline";
  return <Badge variant={tone as any}>{q}</Badge>;
}

function moveItem<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

interface Props {
  value: CascadePolicyConfig;
  onChange: (v: CascadePolicyConfig) => void;
}

export default function CascadePolicyEditor({ value, onChange }: Props) {
  const { numbers: AVAILABLE_NUMBERS } = useAvailableNumbers();
  const [cfg, setCfg] = React.useState<CascadePolicyConfig>(value ?? defaultCascadePolicyConfig);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => setCfg(value), [value]);
  React.useEffect(() => onChange(cfg), [cfg]);

  const addNumber = (id: string) => {
    if (!id) return;
    if (cfg.numbers_order.includes(id)) return;
    setCfg((c) => ({
      ...c,
      numbers_order: [...c.numbers_order, id],
      number_quotas: { ...c.number_quotas, [id]: c.number_quotas[id] ?? 1000 },
      per_number: { ...c.per_number, [id]: c.per_number?.[id] ?? { mpsTarget: 80, util_stack: [] } },
    }));
  };

  const removeNumber = (id: string) => {
    setCfg((c) => {
      const { [id]: _, ...rest } = c.number_quotas;
      const { [id]: __, ...restPer } = c.per_number || {};
      return { ...c, numbers_order: c.numbers_order.filter((n) => n !== id), number_quotas: rest, per_number: restPer };
    });
  };

  const availableToAdd = AVAILABLE_NUMBERS.filter((n) => !cfg.numbers_order.includes(n.id));

  // Drag and drop handlers para reordenar números
  const dragIndex = React.useRef<number | null>(null);
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === index) return;
    setCfg((c) => ({ ...c, numbers_order: moveItem(c.numbers_order, from, index) }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração por campanha – Política de Cascata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ordem e cotas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Ordem fixa de números</Label>
            <div className="flex items-center gap-2">
              <Select onValueChange={addNumber}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Adicionar número ao fim" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border divide-y">
            {cfg.numbers_order.map((id, idx) => {
              const meta = AVAILABLE_NUMBERS.find((n) => n.id === id);
              const per = cfg.per_number?.[id] ?? {};
              const isOpen = !!expanded[id];
              return (
                <div key={id} className="">
                  <div
                    className="flex items-center gap-3 p-3 cursor-move"
                    draggable
                    onDragStart={handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(idx)}
                  >
                    <div className="flex items-center gap-2 w-12">
                      <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <div className="w-6 text-center text-sm text-muted-foreground">{idx + 1}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{meta?.label ?? id}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Status: {meta?.status ?? "ACTIVE"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">Qualidade: <QualityBadge q={(meta?.quality as MinQuality) ?? "HIGH"} /></span>
                      </div>
                    </div>
                    <div className="w-36">
                      <Label className="text-xs">Cota</Label>
                      <Input
                        type="number"
                        value={cfg.number_quotas[id] ?? 0}
                        min={0}
                        onChange={(e) =>
                          setCfg((c) => ({
                            ...c,
                            number_quotas: { ...c.number_quotas, [id]: Number(e.target.value || 0) },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setExpanded((m) => ({ ...m, [id]: !m[id] }))}>{isOpen ? "Fechar" : "Configurar"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeNumber(id)}>Remover</Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-3 border-t bg-muted/10">
                      <div className="grid md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">phone_number_id</Label>
                          <Input
                            placeholder="pnid_..."
                            value={per.phoneNumberId ?? ""}
                            onChange={(e) => setCfg((c) => ({ ...c, per_number: { ...c.per_number, [id]: { ...per, phoneNumberId: e.target.value } } }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">waba_id</Label>
                          <Input
                            placeholder="waba_..."
                            value={per.wabaId ?? ""}
                            onChange={(e) => setCfg((c) => ({ ...c, per_number: { ...c.per_number, [id]: { ...per, wabaId: e.target.value } } }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">MPS alvo</Label>
                          <Input
                            type="number"
                            min={0}
                            value={per.mpsTarget ?? 80}
                            onChange={(e) => setCfg((c) => ({ ...c, per_number: { ...c.per_number, [id]: { ...per, mpsTarget: Number(e.target.value || 0) } } }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">MPS atual (auto)</Label>
                          <Input disabled value={Math.max(0, (per.mpsTarget ?? 80) - 5)} />
                        </div>
                      </div>

                      <div className="mt-3">
                        <TemplateStackEditor
                          title="Cadeia de UTIL por número"
                          value={per.util_stack ?? []}
                          onChange={(list) => setCfg((c) => ({ ...c, per_number: { ...c.per_number, [id]: { ...per, util_stack: list } } }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">A ordem é fixa. Números abaixo da qualidade mínima serão pulados apenas neste giro.</p>
        </div>

        {/* Regras e categorias */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Qualidade mínima</Label>
            <Select value={cfg.min_quality} onValueChange={(v) => setCfg((c) => ({ ...c, min_quality: v as MinQuality }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="LOW">LOW</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria desejada</Label>
            <Select value={cfg.desired_category} onValueChange={(v) => setCfg((c) => ({ ...c, desired_category: v as DesiredCategory }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UTILITY">UTILITY</SelectItem>
                <SelectItem value="MARKETING">MARKETING</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Retries (max)</Label>
              <Input type="number" min={0} value={cfg.retry.max}
                onChange={(e) => setCfg((c) => ({ ...c, retry: { ...c.retry, max: Number(e.target.value || 0) } }))}
              />
            </div>
            <div>
              <Label>Backoff (s)</Label>
              <Input type="number" min={0} value={cfg.retry.backoffSec}
                onChange={(e) => setCfg((c) => ({ ...c, retry: { ...c.retry, backoffSec: Number(e.target.value || 0) } }))}
              />
            </div>
          </div>
        </div>

        {/* Regras de progressão */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <Label>Avançar apenas quando o número cair qualidade</Label>
              <p className="text-xs text-muted-foreground">Mantém o mesmo número; só troca ao detectar queda de qualidade.</p>
            </div>
            <Switch
              checked={cfg.rules.progressOnlyOnQualityDrop}
              onCheckedChange={(v) => setCfg((c) => ({ ...c, rules: { ...c.rules, progressOnlyOnQualityDrop: !!v } }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Quando o template mudar de categoria</Label>
            <Select
              value={cfg.rules.categoryChangeBehavior}
              onValueChange={(v) => setCfg((c) => ({ ...c, rules: { ...c.rules, categoryChangeBehavior: v as any } }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SWAP_TEMPLATE_SAME_NUMBER">Trocar só o template no mesmo número</SelectItem>
                <SelectItem value="MOVE_TO_NEXT_NUMBER">Ir para o próximo número da ordem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pilhas de templates */}
        <div className="grid md:grid-cols-1 gap-4">
          <TemplateStackEditor
            title="Cadeia (UTILITY)"
            value={cfg.template_stack_util}
            onChange={(list) => setCfg((c) => ({ ...c, template_stack_util: list }))}
          />
        </div>

        {/* Preview JSON */}
        <div className="space-y-2">
          <Label>Preview JSON</Label>
          <pre className="text-xs rounded-md border p-3 bg-muted/30 overflow-auto">
            {JSON.stringify(cfg, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateStackEditor({ title, value, onChange }: { title: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = React.useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...value, v]);
    setInput("");
  };

  const remove = (idx: number) => {
    const copy = [...value];
    copy.splice(idx, 1);
    onChange(copy);
  };

  const up = (idx: number) => {
    if (idx === 0) return;
    const copy = [...value];
    const [it] = copy.splice(idx, 1);
    copy.splice(idx - 1, 0, it);
    onChange(copy);
  };
  const down = (idx: number) => {
    if (idx === value.length - 1) return;
    const copy = [...value];
    const [it] = copy.splice(idx, 1);
    copy.splice(idx + 1, 0, it);
    onChange(copy);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="ex.: util_1" />
          <Button onClick={add}>Adicionar</Button>
        </div>
        <div className="rounded-md border divide-y">
          {value.length === 0 && <div className="text-sm text-muted-foreground p-3">Vazio</div>}
          {value.map((tpl, idx) => (
            <div key={tpl + idx} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className="w-6 text-center text-xs text-muted-foreground">{idx + 1}</div>
                <div className="font-mono text-sm">{tpl}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => up(idx)} disabled={idx === 0}>↑</Button>
                <Button variant="outline" size="sm" onClick={() => down(idx)} disabled={idx === value.length - 1}>↓</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(idx)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
