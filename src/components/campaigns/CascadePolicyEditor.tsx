import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import { GripVertical } from "lucide-react";
import { AVAILABLE_NUMBERS } from "@/data/numbersPool";

export type MinQuality = "HIGH" | "MEDIUM" | "LOW";
export type DesiredCategory = "UTILITY" | "MARKETING";

export type CascadePolicyConfig = {
  numbers_order: string[];
  number_quotas: Record<string, number>;
  min_quality: MinQuality;
  template_stack_util: string[];
  template_stack_mkt: string[];
  desired_category: DesiredCategory;
  retry: { max: number; backoffSec: number };
};

export const defaultCascadePolicyConfig: CascadePolicyConfig = {
  numbers_order: ["num_A", "num_B", "num_C"],
  number_quotas: { num_A: 1000, num_B: 1000, num_C: 1000 },
  min_quality: "HIGH",
  template_stack_util: ["util_1", "util_2"],
  template_stack_mkt: ["mkt_1", "mkt_2"],
  desired_category: "UTILITY",
  retry: { max: 3, backoffSec: 10 },
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
  const [cfg, setCfg] = React.useState<CascadePolicyConfig>(value ?? defaultCascadePolicyConfig);

  React.useEffect(() => setCfg(value), [value]);
  React.useEffect(() => onChange(cfg), [cfg]);

  const addNumber = (id: string) => {
    if (!id) return;
    if (cfg.numbers_order.includes(id)) return;
    setCfg((c) => ({
      ...c,
      numbers_order: [...c.numbers_order, id],
      number_quotas: { ...c.number_quotas, [id]: c.number_quotas[id] ?? 1000 },
    }));
  };

  const removeNumber = (id: string) => {
    setCfg((c) => {
      const { [id]: _, ...rest } = c.number_quotas;
      return { ...c, numbers_order: c.numbers_order.filter((n) => n !== id), number_quotas: rest };
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
              return (
                <div
                  key={id}
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
                    <Button variant="ghost" size="sm" onClick={() => removeNumber(id)}>Remover</Button>
                  </div>
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

        {/* Pilhas de templates */}
        <div className="grid md:grid-cols-2 gap-4">
          <TemplateStackEditor
            title="Cadeia (UTILITY)"
            value={cfg.template_stack_util}
            onChange={(list) => setCfg((c) => ({ ...c, template_stack_util: list }))}
          />
          <TemplateStackEditor
            title="Cadeia (MARKETING)"
            value={cfg.template_stack_mkt}
            onChange={(list) => setCfg((c) => ({ ...c, template_stack_mkt: list }))}
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
