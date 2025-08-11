import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PoolEditor from "@/components/senders/PoolEditor";
import CascadePolicyEditor, { CascadePolicyConfig, defaultCascadePolicyConfig } from "@/components/campaigns/CascadePolicyEditor";
import { useEffect, useState } from "react";
import { useOpsTabs } from "@/context/OpsTabsContext";
import { useParams } from "react-router-dom";

export default function CampaignConsole() {
  const { id } = useParams();
  const { openTab } = useOpsTabs();
  const [openPool, setOpenPool] = useState(false);
  const [policyConfig, setPolicyConfig] = useState<CascadePolicyConfig>(defaultCascadePolicyConfig);

  useEffect(() => {
    if (id) openTab({ id, type: "campaign", title: `Campanha ${id.slice(-4)}`, status: "Running", path: `/campaigns/${id}/console` });
  }, [id]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Console da Campanha</h1>
            <p className="text-muted-foreground">Acompanhe a execução e ajuste o rodízio.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Pausar</Button>
            <Button onClick={() => setOpenPool(true)}>Configurar Números e Sequência</Button>
            <Button variant="outline">Exportar CSV</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por número</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 bg-secondary rounded" />
              <div className="text-xs text-muted-foreground">Sender-01 50% · Sender-02 30% · Sender-03 20%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Saúde do pool</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>Falha %: <span className="font-medium text-destructive">3.1%</span></div>
              <div>429/min: <span className="font-medium">0.8</span></div>
              <div>Quality mix: <span className="font-medium">2G · 1Y</span></div>
              <div>Tier restante: <span className="font-medium">72%</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>Enviadas: <span className="font-medium">12.340</span></div>
              <div>Entregues: <span className="font-medium text-success">12.100</span></div>
              <div>Lidas: <span className="font-medium text-primary">10.920</span></div>
              <div>CTR: <span className="font-medium">7,3%</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Política de Disparo */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Política de Disparo</CardTitle></CardHeader>
          <CardContent>
            <CascadePolicyEditor value={policyConfig} onChange={setPolicyConfig} />
            <p className="text-xs text-muted-foreground mt-2">
              Alterações durante a execução: ordem aplica no próximo ciclo; qualidade mínima e fallback são imediatos; cotas afetam apenas o remanescente.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Problemas (últimos 5 min)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border rounded p-2">
              <span>429 em Sender-02</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Reprocessar</Button>
                <Button variant="ghost" size="sm">Ver payload</Button>
              </div>
            </div>
            <div className="flex items-center justify-between border rounded p-2">
              <span>Undeliverable por número inválido</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Bloquear contato</Button>
                <Button variant="ghost" size="sm">Ver payload</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PoolEditor open={openPool} onOpenChange={setOpenPool} />
    </AppLayout>
  );
}
