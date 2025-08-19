import { useEffect, useMemo, useRef } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SingleLineChart } from "@/components/dashboard/SingleLineChart"
import { Download, RefreshCw } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useReportsData } from "@/hooks/useReportsData"

const Reports = () => {
  const reportRef = useRef<HTMLDivElement | null>(null)
  const { campaigns, hourlyStats, loading, refreshData } = useReportsData();

  // SEO basics for this page
  useEffect(() => {
    document.title = "Relatórios de Campanhas | Console"

    const descText = "Relatórios de performance e custos com exportação em PDF."
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "description"
      document.head.appendChild(meta)
    }
    meta.content = descText

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}/reports`
  }, [])

  // Use real chart data from hourly stats
  const chartData = useMemo(() => {
    return hourlyStats.map(stat => ({
      time: stat.hour,
      delivered: stat.delivered,
      read: stat.read
    }));
  }, [hourlyStats]);

  // Calculate totals from real campaign data
  const totals = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.sent += campaign.messages_sent;
        acc.delivered += campaign.messages_delivered;
        acc.read += campaign.messages_read;
        acc.replies += 0; // No replies tracking yet
        acc.cost += campaign.estimated_cost;
        return acc;
      },
      { sent: 0, delivered: 0, read: 0, replies: 0, cost: 0 }
    );
  }, [campaigns]);

  const currency = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  )
  const percent = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }),
    []
  )

  const handleExportPDF = async () => {
    if (!reportRef.current) return

    const element = reportRef.current
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
    const imgData = canvas.toDataURL("image/png")

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
    const imgWidth = canvas.width * ratio
    const imgHeight = canvas.height * ratio
    const marginX = (pageWidth - imgWidth) / 2
    const marginY = 10 // leve margem superior

    pdf.addImage(imgData, "PNG", marginX, marginY, imgWidth, imgHeight)
    pdf.save(`relatorio-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Campanhas</h1>
            <p className="text-muted-foreground">Análise detalhada de performance e custos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={refreshData} 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleExportPDF} aria-label="Exportar relatório em PDF" className="gap-2">
              <Download className="w-4 h-4" /> Exportar PDF
            </Button>
          </div>
        </header>

        <main>
          <section ref={reportRef} className="space-y-6">
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Entregas e leituras por hora</CardTitle>
  </CardHeader>
  <CardContent>
    <SingleLineChart data={chartData} />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle className="text-lg">Resumo por campanha</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableCaption>
        {campaigns.length === 0 ? "Nenhuma campanha encontrada." : "Dados reais de campanhas ativas."}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Campanha</TableHead>
          <TableHead className="text-right">Enviadas</TableHead>
          <TableHead className="text-right">Entregues</TableHead>
          <TableHead className="text-right">Lidas</TableHead>
          <TableHead className="text-right">Respostas</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">Custo</TableHead>
          <TableHead className="text-right">Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              {loading ? "Carregando campanhas..." : "Nenhuma campanha encontrada"}
            </TableCell>
          </TableRow>
        ) : (
          campaigns.map((campaign) => {
            const ctr = campaign.messages_delivered > 0 ? (campaign.messages_read / campaign.messages_delivered) : 0;
            return (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell className="text-right">{campaign.messages_sent.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right">{campaign.messages_delivered.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right">{campaign.messages_read.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right">0</TableCell>
                <TableCell className="text-right">{percent.format(ctr)}</TableCell>
                <TableCell className="text-right">{currency.format(campaign.estimated_cost)}</TableCell>
                <TableCell className="text-right">{new Date(campaign.created_at).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Totais</TableCell>
          <TableCell className="text-right font-semibold">{totals.sent.toLocaleString("pt-BR")}</TableCell>
          <TableCell className="text-right font-semibold">{totals.delivered.toLocaleString("pt-BR")}</TableCell>
          <TableCell className="text-right font-semibold">{totals.read.toLocaleString("pt-BR")}</TableCell>
          <TableCell className="text-right font-semibold">{totals.replies.toLocaleString("pt-BR")}</TableCell>
          <TableCell className="text-right font-semibold">{percent.format(totals.delivered ? totals.replies / totals.delivered : 0)}</TableCell>
          <TableCell className="text-right font-semibold">{currency.format(totals.cost)}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  </CardContent>
</Card>
          </section>
        </main>
      </div>
    </AppLayout>
  )
}

export default Reports
