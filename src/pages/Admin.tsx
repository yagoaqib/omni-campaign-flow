import { AppLayout } from "@/components/layout/AppLayout"
import ClientCredentialsForm from "@/components/admin/ClientCredentialsForm"
import { useWorkspace } from "@/hooks/useWorkspace"

const Admin = () => {
  const { activeWorkspace, wabas, loadWabas, updateWaba, createWaba } = useWorkspace();

  // WABAs are automatically loaded when workspace changes in the hook

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground">Configurações de credenciais Meta WhatsApp Cloud</p>
        </div>
        <section>
          <ClientCredentialsForm 
            workspaceName={activeWorkspace?.name || "Cliente"}
            wabas={wabas}
            onUpdateWaba={updateWaba}
            onCreateWaba={createWaba}
          />
        </section>
      </div>
    </AppLayout>
  )
}

export default Admin