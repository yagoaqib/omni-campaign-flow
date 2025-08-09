import { AppLayout } from "@/components/layout/AppLayout"
import NumbersIntegration from "@/components/admin/NumbersIntegration"

const Admin = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground">Configurações de provedores e integrações</p>
        </div>
        <section>
          {/* Integrações > Números */}
          <NumbersIntegration />
        </section>
      </div>
    </AppLayout>
  )
}

export default Admin