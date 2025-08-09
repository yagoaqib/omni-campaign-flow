import { AppLayout } from "@/components/layout/AppLayout"

const Admin = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground">
            Configurações de provedores e integrações
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Em construção...</p>
        </div>
      </div>
    </AppLayout>
  )
}

export default Admin