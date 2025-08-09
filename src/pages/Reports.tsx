import { AppLayout } from "@/components/layout/AppLayout"

const Reports = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada de performance e custos
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Em construção...</p>
        </div>
      </div>
    </AppLayout>
  )
}

export default Reports