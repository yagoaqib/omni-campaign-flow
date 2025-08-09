import { AppLayout } from "@/components/layout/AppLayout"

const Logs = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>
          <p className="text-muted-foreground">
            Logs de aplicação e webhooks
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Em construção...</p>
        </div>
      </div>
    </AppLayout>
  )
}

export default Logs