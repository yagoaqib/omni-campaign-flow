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
import { useAvailableNumbers, AvailableNumber } from "@/hooks/useAvailableNumbers";

type NumberStatus = "ACTIVE" | "PAUSED" | "BLOCKED";
type PoolMinQuality = "HIGH" | "MEDIUM" | "LOW";
const NUMBERS_STORAGE_KEY = "numbers_pool_v1";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NumberWizard from "@/components/admin/NumberWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateMappingsTab from "@/components/admin/TemplateMappingsTab";
import type { TemplateMapping } from "@/components/admin/types";
import type { TemplateModel } from "@/components/templates/types";
import { Link } from "react-router-dom";

// Tipo estendido apenas para Admin (mantém compatibilidade com AvailableNumber em outras telas)
export type ExtendedNumber = AvailableNumber & {
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
  const [form, setForm] = React.useState<ExtendedNumber>({ 
    id: "", 
    label: "", 
    quality: "HIGH", 
    status: "ACTIVE", 
    displayNumber: "",
    mpsTarget: 80,
    provider: "", 
    wabaId: "", 
    phoneId: "", 
    tps: 10, 
    utilityTemplates: [], 
    equivalentMappings: [] 
  });
const [newTpl, setNewTpl] = React.useState("");
const [wizardOpen, setWizardOpen] = React.useState(false);
// Catálogo local de templates (para escolher pelo ID)
const [catalog] = useLocalStorage<TemplateModel[]>("templates", []);

  // Remover inicialização automática - agora é manual via wizard
  React.useEffect(() => {
    // Removido: seed automático do pool local
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
        <p className="text-muted-foreground">
          A gestão de números foi centralizada em <strong>Números &amp; Senders</strong>. Cadastre e edite números por lá.
        </p>
        <Link to="/senders">
          <Button className="gap-2">Ir para Números &amp; Senders</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

