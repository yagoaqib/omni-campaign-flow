import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TemplateMapping } from "./types";

type Props = {
  mappings: TemplateMapping[] | undefined;
  currentId: string;
  numbers: { id: string; label: string }[];
  onChange: (next: TemplateMapping[]) => void;
};

export default function TemplateMappingsTab({ mappings, currentId, numbers, onChange }: Props) {
  const { toast } = useToast();
  const [localTpl, setLocalTpl] = React.useState("");
  const [targetNumberId, setTargetNumberId] = React.useState<string>("");
  const [targetTpl, setTargetTpl] = React.useState("");
  // Equivalentes locais (mesmo número)
  const [localFrom, setLocalFrom] = React.useState("");
  const [localTo, setLocalTo] = React.useState("");

  const selectableNumbers = React.useMemo(() => numbers.filter((n) => n.id !== currentId), [numbers, currentId]);

  const localEquivalents = React.useMemo(() => (mappings ?? []).filter((m) => m.targetNumberId === currentId), [mappings, currentId]);
  const crossNumberMappings = React.useMemo(() => (mappings ?? []).filter((m) => m.targetNumberId !== currentId), [mappings, currentId]);

  const addLocalEquivalent = () => {
    if (!localFrom.trim() || !localTo.trim()) return;
    const next: TemplateMapping = {
      id: `map_${Date.now()}`,
      local: localFrom.trim(),
      targetNumberId: currentId,
      targetTemplate: localTo.trim(),
    };
    onChange([...(mappings ?? []), next]);
    setLocalFrom("");
    setLocalTo("");
    toast({ title: "Equivalente local adicionado", description: "Usado antes do fallback entre números." });
  };

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

  return (
    <div className="space-y-6">
      {/* Equivalentes locais (mesmo número) */}
      <div className="space-y-2">
        <Label>Equivalentes locais (mesmo número)</Label>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          <div className="md:col-span-5">
            <Label className="text-xs">Template utilitário</Label>
            <Input placeholder="ex.: util_nota_fiscal" value={localFrom} onChange={(e) => setLocalFrom(e.target.value)} />
          </div>
          <div className="md:col-span-6">
            <Label className="text-xs">Trocar para</Label>
            <Input placeholder="ex.: util_nota_fiscal_b" value={localTo} onChange={(e) => setLocalTo(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Button className="w-full" variant="secondary" onClick={addLocalEquivalent}>Adicionar</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Regra: ao detectar qualidade VERMELHA (RED), status Paused/Disabled ou reclassificação para Marketing, trocamos para o equivalente local primeiro — sem mudar de número.</p>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template local</TableHead>
                <TableHead>Usar em seguida</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localEquivalents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Nenhum equivalente local cadastrado.</TableCell>
                </TableRow>
              ) : (
                localEquivalents.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.local}</TableCell>
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

      {/* Fallback entre números */}
      <div className="space-y-2">
        <Label>Adicionar mapeamento de fallback entre números</Label>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          <div className="md:col-span-4">
            <Label className="text-xs">Template local</Label>
            <Input placeholder="ex.: promo_pt_BR" value={localTpl} onChange={(e) => setLocalTpl(e.target.value)} />
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
            <Input placeholder="ex.: promo_b" value={targetTpl} onChange={(e) => setTargetTpl(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Button className="w-full" variant="secondary" onClick={addMapping}>Adicionar</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Regra: primeiro tentamos equivalentes locais; o fallback entre números só deve ocorrer quando a qualidade global do número cair de HIGH (verde).</p>

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
