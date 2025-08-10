import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AVAILABLE_NUMBERS, NUMBERS_STORAGE_KEY, NumberInfo, NumberStatus, PoolMinQuality, loadAvailableNumbers } from "@/data/numbersPool";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NumberWizard from "@/components/admin/NumberWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateMappingsTab from "@/components/admin/TemplateMappingsTab";
import type { TemplateMapping } from "@/components/admin/types";
import type { TemplateModel } from "@/components/templates/types";

// Tipo estendido apenas para Admin (mantém compatibilidade com NumberInfo em outras telas)
export type ExtendedNumber = NumberInfo & {
  provider?: string;
  wabaId?: string;
  phoneId?: string;
  tps?: number;
  utilityTemplates?: string[];
  // Campos adicionais do wizard
  phoneE164?: string;
  usage?: "marketing" | "transacional" | "ambos";
  pools?: string[];
  canFallback?: boolean;
  // payloads específicos (mantidos para futura edição)
  meta?: any;
  infobip?: any;
  gupshup?: any;
  // mapeamentos de templates equivalentes (fallback)
  equivalentMappings?: TemplateMapping[];
};

const qualityOptions: PoolMinQuality[] = ["HIGH", "MEDIUM", "LOW"];
const statusOptions: NumberStatus[] = ["ACTIVE", "PAUSED", "BLOCKED"];

export default function NumbersIntegration() {
  const { toast } = useToast();
  const [items, setItems] = useLocalStorage<ExtendedNumber[]>(NUMBERS_STORAGE_KEY, []);
const [open, setOpen] = React.useState(false);
const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
const [form, setForm] = React.useState<ExtendedNumber>({ id: "", label: "", quality: "HIGH", status: "ACTIVE", provider: "", wabaId: "", phoneId: "", tps: 10, utilityTemplates: [], equivalentMappings: [] });
const [newTpl, setNewTpl] = React.useState("");
const [wizardOpen, setWizardOpen] = React.useState(false);
// Catálogo local de templates (para escolher pelo ID)
const [catalog] = useLocalStorage<TemplateModel[]>("templates", []);

  // Seed inicial a partir do pool atual quando storage vazio
  React.useEffect(() => {
    if (!items || items.length === 0) {
      const base = (loadAvailableNumbers?.() ?? AVAILABLE_NUMBERS).map((n) => ({ ...n, provider: "", wabaId: "", phoneId: "", tps: 10, utilityTemplates: [] as string[], equivalentMappings: [] as TemplateMapping[] }));
      setItems(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    setForm(items[idx]);
    setOpen(true);
  };

  const saveForm = () => {
    const next = [...items];
    if (editingIndex === null) next.push(form);
    else next[editingIndex] = form;
    setItems(next);
    setOpen(false);
    setEditingIndex(null);
    toast({ title: "Números atualizados", description: "As alterações foram salvas localmente." });
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    toast({ title: "Número removido" });
  };

const updateInline = (idx: number, patch: Partial<ExtendedNumber>) => {
  const next = [...items];
  next[idx] = { ...next[idx], ...patch };
  setItems(next);
};

const handleWizardSaved = (data: ExtendedNumber) => {
  setItems((prev) => [...prev, data]);
  setWizardOpen(false);
  toast({ title: "Número adicionado", description: "Criado via Wizard e salvo localmente." });
};

  const addTemplate = () => {
    const id = newTpl.trim();
    if (!id) return;
    setForm((f) => {
      const current = [...(f.utilityTemplates ?? [])];
      if (!current.includes(id)) current.push(id);
      return { ...f, utilityTemplates: current };
    });
    setNewTpl("");
  };

  const removeTemplate = (tpl: string) => {
    setForm((f) => ({ ...f, utilityTemplates: (f.utilityTemplates ?? []).filter((t) => t !== tpl) }));
  };

  const moveUp = (tpl: string) => {
    setForm((f) => {
      const arr = [...(f.utilityTemplates ?? [])];
      const i = arr.indexOf(tpl);
      if (i > 0) {
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      }
      return { ...f, utilityTemplates: arr };
    });
  };

  const moveDown = (tpl: string) => {
    setForm((f) => {
      const arr = [...(f.utilityTemplates ?? [])];
      const i = arr.indexOf(tpl);
      if (i !== -1 && i < arr.length - 1) {
        [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      }
      return { ...f, utilityTemplates: arr };
    });
  };

  const tplLabel = (id: string) => {
    const t = catalog.find((x) => x.id === id);
    return t ? `${id} — ${t.name}` : id;
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrações · Números</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
<div className="flex items-center justify-between gap-2">
  <p className="text-muted-foreground">Cadastre os números (WABA/Phone ID), status/qualidade e templates de utilidade. Persistência local.</p>
  <div className="flex items-center gap-2">
    <Button variant="secondary" onClick={() => setWizardOpen(true)}>
      <Plus className="h-4 w-4 mr-2" /> Novo número (Wizard)
    </Button>
  </div>
</div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Label</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>WABA ID</TableHead>
                <TableHead>Phone ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Templates util.</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((n, idx) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.label}</TableCell>
                  <TableCell>{n.provider || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{n.wabaId || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{n.phoneId || "-"}</TableCell>
                  <TableCell>
                    <Select value={n.status} onValueChange={(v: NumberStatus) => updateInline(idx, { status: v })}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={n.quality} onValueChange={(v: PoolMinQuality) => updateInline(idx, { quality: v })}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {qualityOptions.map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{(n.utilityTemplates?.length ?? 0)} itens</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="icon" variant="outline" onClick={() => openEdit(idx)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={() => removeItem(idx)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

<NumberWizard open={wizardOpen} onOpenChange={setWizardOpen} onSave={handleWizardSaved} />

<Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIndex === null ? "Novo número" : "Editar número"}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="geral" className="mt-1">
              <TabsList>
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="equivalentes">Templates equivalentes</TabsTrigger>
              </TabsList>

              <TabsContent value="geral">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <Input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="ex.: num_X" />
                  </div>
                  <div>
                    <Label>Label</Label>
                    <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="ex.: Sender-06 (+55 61)" />
                  </div>
                  <div>
                    <Label>Provider/BSP</Label>
                    <Input value={form.provider ?? ""} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} placeholder="ex.: 360Dialog, Infobip" />
                  </div>
                  <div>
                    <Label>WABA ID</Label>
                    <Input value={form.wabaId ?? ""} onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))} placeholder="ex.: 123456789" />
                  </div>
                  <div>
                    <Label>Phone Number ID</Label>
                    <Input value={form.phoneId ?? ""} onChange={(e) => setForm((f) => ({ ...f, phoneId: e.target.value }))} placeholder="ex.: 987654321" />
                  </div>
                  <div>
                    <Label>TPS (opcional)</Label>
                    <Input type="number" value={form.tps ?? 10} onChange={(e) => setForm((f) => ({ ...f, tps: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v: NumberStatus) => setForm((f) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Qualidade</Label>
                    <Select value={form.quality} onValueChange={(v: PoolMinQuality) => setForm((f) => ({ ...f, quality: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {qualityOptions.map((q) => (<SelectItem key={q} value={q}>{q}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Templates de utilidade (ordem de execução)</Label>
                  <div className="flex items-center gap-2">
                    <Select value={newTpl} onValueChange={setNewTpl}>
                      <SelectTrigger className="w-full md:w-[420px]"><SelectValue placeholder="Selecione pelo ID" /></SelectTrigger>
                      <SelectContent>
                        {catalog.length === 0 ? (
                          <SelectItem value="__empty" disabled>Nenhum template no catálogo</SelectItem>
                        ) : (
                          catalog.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.id} — {t.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button variant="secondary" onClick={addTemplate} disabled={!newTpl || newTpl === "__empty"}>Adicionar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Escolha pelo ID e ordene. A execução seguirá a ordem listada abaixo.</p>
                  <div className="space-y-2 mt-2">
                    {(form.utilityTemplates ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum template na cadeia ainda.</p>
                    ) : (
                      (form.utilityTemplates ?? []).map((tpl, idx) => (
                        <div key={tpl} className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center">
                            <span className="text-xs text-muted-foreground mr-2">#{idx + 1}</span>
                            <span className="font-mono text-xs">{tpl}</span>
                            {catalog.find((x) => x.id === tpl)?.name && (
                              <span className="text-xs text-muted-foreground ml-2">— {catalog.find((x) => x.id === tpl)!.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" onClick={() => moveUp(tpl)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" onClick={() => moveDown(tpl)} aria-label="Descer"><ArrowDown className="h-4 w-4" /></Button>
                            <Button size="icon" variant="destructive" onClick={() => removeTemplate(tpl)} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="equivalentes">
                <TemplateMappingsTab
                  mappings={form.equivalentMappings ?? []}
                  numbers={items.map((n) => ({ id: n.id, label: n.label }))}
                  currentId={form.id}
                  onChange={(next) => setForm((f) => ({ ...f, equivalentMappings: next }))}
                />
              </TabsContent>
            </Tabs>

<DialogFooter>
  <Button onClick={saveForm}>Salvar</Button>
</DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
