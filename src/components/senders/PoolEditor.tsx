import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface SenderOption {
  id: number;
  name: string;
  checked: boolean;
}

interface PoolEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PoolEditor({ open, onOpenChange }: PoolEditorProps) {
  const [policy, setPolicy] = useState("wrr");
  const [tps, setTps] = useState<number[]>([20]);
  const [rules, setRules] = useState<Record<string, boolean>>({
    qualityRed: true,
    tier90: true,
    fail10: true,
    cooldown: true,
  });

  const [senders] = useState<SenderOption[]>([
    { id: 1, name: "Sender-01", checked: true },
    { id: 2, name: "Sender-02", checked: true },
    { id: 3, name: "Sender-03", checked: true },
  ]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-3xl ml-auto">
        <DrawerHeader>
          <DrawerTitle>Editor de Pool</DrawerTitle>
          <DrawerDescription>Defina a política de rodízio, regras automáticas e TPS.</DrawerDescription>
        </DrawerHeader>

        <div className="p-6 space-y-6">
          {/* Participantes */}
          <div className="space-y-3">
            <Label>Senders</Label>
            <div className="grid grid-cols-2 gap-3">
              {senders.map((s) => (
                <label key={s.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                  <Checkbox defaultChecked={s.checked} />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Política */}
          <div className="space-y-3">
            <Label>Política de Rodízio</Label>
            <RadioGroup value={policy} onValueChange={setPolicy} className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="wrr" id="wrr" />
                <span>Weighted Round-Robin (WRR)</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="rr" id="rr" />
                <span>Round-Robin puro</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="sticky" id="sticky" />
                <span>Sticky-session</span>
              </label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Regras automáticas */}
          <div className="space-y-3">
            <Label>Regras automáticas</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox checked={rules.qualityRed} onCheckedChange={(v) => setRules((r) => ({ ...r, qualityRed: !!v }))} />
                <span>Reduzir peso se Quality = Red</span>
              </label>
              <label className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox checked={rules.tier90} onCheckedChange={(v) => setRules((r) => ({ ...r, tier90: !!v }))} />
                <span>Reduzir peso em 90% do Tier</span>
              </label>
              <label className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox checked={rules.fail10} onCheckedChange={(v) => setRules((r) => ({ ...r, fail10: !!v }))} />
                <span>Pausar em Falha ≥10% (5 min)</span>
              </label>
              <label className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox checked={rules.cooldown} onCheckedChange={(v) => setRules((r) => ({ ...r, cooldown: !!v }))} />
                <span>Cooldown 30 min e reaquecer</span>
              </label>
            </div>
          </div>

          <Separator />

          {/* TPS */}
          <div className="space-y-3">
            <Label>TPS global da campanha</Label>
            <Slider value={tps} max={100} step={1} onValueChange={setTps} />
            <div className="text-sm text-muted-foreground">Atual: {tps[0]} TPS</div>
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={() => onOpenChange(false)}>Salvar</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
