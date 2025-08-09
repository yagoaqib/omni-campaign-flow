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
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const Reports = () => {
  const reportRef = useRef<HTMLDivElement | null>(null)

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

  // Mock chart data (exemplo)
  const chartData = useMemo(
    () => [
      { time: "08:00", delivered: 120, read: 96 },
      { time: "09:00", delivered: 180, read: 150 },
      { time: "10:00", delivered: 220, read: 176 },
      { time: "11:00", delivered: 260, read: 208 },
      { time: "12:00", delivered: 200, read: 160 },
      { time: "13:00", delivered: 240, read: 192 },
      { time: "14:00", delivered: 280, read: 224 },
      { time: "15:00", delivered: 300, read: 240 },
      { time: "16:00", delivered: 260, read: 210 },
      { time: "17:00", delivered: 230, read: 190 },
      { time: "18:00", delivered: 210, read: 175 },
      { time: "19:00", delivered: 170, read: 140 },
    ],
    []
  )

  type Row = {
    campaign: string
    sent: number
    delivered: number
    read: number
    replies: number
    cost: number // em BRL
    date: string
  }

  const rows: Row[] = useMemo(
    () => [
      { campaign: "Lançamento Q3", sent: 12000, delivered: 11200, read: 8900, replies: 860, cost: 1580.4, date: "2025-08-08" },
      { campaign: "Retenção VIP", sent: 5400, delivered: 5100, read: 4200, replies: 510, cost: 712.1, date: "2025-08-08" },
      { campaign: "Cross-sell", sent: 7600, delivered: 7000, read: 5520, replies: 430, cost: 998.7, date: "2025-08-07" },
      { campaign: "Reativação", sent: 3200, delivered: 2800, read: 2100, replies: 160, cost: 362.3, date: "2025-08-07" },
    ],
    []
  )

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.sent += r.sent
        acc.delivered += r.delivered
        acc.read += r.read
        acc.replies += r.replies
        acc.cost += r.cost
        return acc
      },
      { sent: 0, delivered: 0, read: 0, replies: 0, cost: 0 }
    )
  }, [rows])

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
            <Button onClick={handleExportPDF} aria-label="Exportar relatório em PDF">
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
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
      <TableCaption>Dados fictícios para demonstração.</TableCaption>
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
        {rows.map((r) => {
          const ctr = r.delivered ? r.replies / r.delivered : 0
          return (
            <TableRow key={r.campaign}>
              <TableCell className="font-medium">{r.campaign}</TableCell>
              <TableCell className="text-right">{r.sent.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right">{r.delivered.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right">{r.read.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right">{r.replies.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right">{percent.format(ctr)}</TableCell>
              <TableCell className="text-right">{currency.format(r.cost)}</TableCell>
              <TableCell className="text-right">{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
            </TableRow>
          )
        })}
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
