import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TemplateMapping } from "./types";
import type { TemplateModel } from "@/components/templates/types";

type Props = {
  mappings: TemplateMapping[] | undefined;
  currentId: string;
  numbers: { id: string; label: string }[];
  catalog: TemplateModel[];
  utilityTemplates: string[];
  onUtilityChange: (next: string[]) => void;
  onChange: (next: TemplateMapping[]) => void;
};

export default function TemplateMappingsTab({ mappings, currentId, numbers, catalog, utilityTemplates, onUtilityChange, onChange }: Props) {
  const { toast } = useToast();
  const [localTpl, setLocalTpl] = React.useState("");
  const [targetNumberId, setTargetNumberId] = React.useState<string>("");
  const [targetTpl, setTargetTpl] = React.useState("");
  // Cascata local (ordem por ID)
  const [newSeqTpl, setNewSeqTpl] = React.useState<string>("");

  const selectableNumbers = React.useMemo(() => numbers.filter((n) => n.id !== currentId), [numbers, currentId]);
  const crossNumberMappings = React.useMemo(() => (mappings ?? []).filter((m) => m.targetNumberId !== currentId), [mappings, currentId]);

  const addMapping = () => {
    if (!localTpl.trim() || !targetTpl.trim() || !targetNumberId) return;
    const next: TemplateMapping = {
      id: `map_${Date.now()}`,
      local: localTpl.trim(),
      targetNumberId,
      targetTemplate: targetTpl.trim(),
    };
    onChange([...(mappings ?? []), next]);
    setLocalTpl("");
    setTargetTpl("");
    setTargetNumberId("");
    toast({ title: "Mapeamento adicionado", description: "Esta regra será usada em caso de fallback." });
  };

  const removeMapping = (id: string) => {
    const next = (mappings ?? []).filter((m) => m.id !== id);
    onChange(next);
    toast({ title: "Mapeamento removido" });
  };

  const targetLabel = (id: string) => (id === currentId ? "Este número" : (numbers.find((n) => n.id === id)?.label ?? id));

  // Cascata local (ordem por ID)
  const addSeq = () => {
    if (!newSeqTpl || newSeqTpl === "__empty") return;
    const arr = [...utilityTemplates];
    if (!arr.includes(newSeqTpl)) arr.push(newSeqTpl);
    onUtilityChange(arr);
    setNewSeqTpl("");
  };
  const removeSeq = (id: string) => onUtilityChange(utilityTemplates.filter((x) => x !== id));
  const moveUp = (id: string) => {
    const arr = [...utilityTemplates];
    const i = arr.indexOf(id);
    if (i > 0) {
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      onUtilityChange(arr);
    }
  };
  const moveDown = (id: string) => {
    const arr = [...utilityTemplates];
    const i = arr.indexOf(id);
    if (i !== -1 && i < arr.length - 1) {
      [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      onUtilityChange(arr);
    }
  };
  const tplName = (id: string) => catalog.find((t) => t.id === id)?.name;

  return (
    <div className="space-y-6">
      {/* Cascata local por IDs */}
      <div className="space-y-2">
        <Label>Cascata local (mesmo número — ordem sequencial)</Label>
        <div className="flex items-center gap-2">
          <Select value={newSeqTpl} onValueChange={setNewSeqTpl}>
            <SelectTrigger className="w-full md:w-[420px]"><SelectValue placeholder="Selecione o ID do template" /></SelectTrigger>
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
          <Button variant="secondary" onClick={addSeq} disabled={!newSeqTpl || newSeqTpl === "__empty"}>Adicionar</Button>
        </div>
        <p className="text-xs text-muted-foreground">Template 1 falha → tenta Template 2 → tenta Template 3... Gatilhos: RED/Paused/Disabled ou reclassificação para Marketing.</p>
        <div className="space-y-2 mt-2">
          {utilityTemplates.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum template na cascata ainda.</p>
          ) : (
            utilityTemplates.map((tpl, idx) => (
              <div key={tpl} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-2">#{idx + 1}</span>
                  <span className="font-mono text-xs">{tpl}</span>
                  {tplName(tpl) && (<span className="text-xs text-muted-foreground ml-2">— {tplName(tpl)}</span>)}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" onClick={() => moveUp(tpl)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" onClick={() => moveDown(tpl)} aria-label="Descer"><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="destructive" onClick={() => removeSeq(tpl)} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fallback entre números */}
      <div className="space-y-2">
        <Label>Fallback entre números</Label>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          <div className="md:col-span-4">
            <Label className="text-xs">Template local</Label>
            <Select value={localTpl} onValueChange={setLocalTpl}>
              <SelectTrigger><SelectValue placeholder="Selecione o ID" /></SelectTrigger>
              <SelectContent>
                {catalog.map((t) => (<SelectItem key={t.id} value={t.id}>{t.id} — {t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4">
            <Label className="text-xs">Número destino</Label>
            <Select value={targetNumberId} onValueChange={setTargetNumberId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {selectableNumbers.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label className="text-xs">Template no destino</Label>
            <Select value={targetTpl} onValueChange={setTargetTpl}>
              <SelectTrigger><SelectValue placeholder="Selecione o ID" /></SelectTrigger>
              <SelectContent>
                {catalog.map((t) => (<SelectItem key={t.id} value={t.id}>{t.id} — {t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Button className="w-full" variant="secondary" onClick={addMapping}>Adicionar</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Só ocorre quando a qualidade global do número cair de HIGH. Primeiro esgota a cascata local.</p>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template local</TableHead>
                <TableHead>Número destino</TableHead>
                <TableHead>Template no destino</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crossNumberMappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Nenhum mapeamento cadastrado.</TableCell>
                </TableRow>
              ) : (
                crossNumberMappings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.local}</TableCell>
                    <TableCell>{targetLabel(m.targetNumberId)}</TableCell>
                    <TableCell className="font-mono text-xs">{m.targetTemplate}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="destructive" onClick={() => removeMapping(m.id)} aria-label="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}