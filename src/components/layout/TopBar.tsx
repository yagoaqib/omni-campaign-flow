import { Search, Bell, ChevronDown, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/hooks/useWorkspace"

// Fallback for demo/mock data
const mockWorkspaces = [
  { id: "1", name: "Cliente A", status: "online" },
  { id: "2", name: "Cliente B", status: "online" },
  { id: "3", name: "Cliente C", status: "offline" },
]

const alerts = [
  { id: 1, type: "quality", message: "Quality drop em WABA-01", workspace: "Cliente A", time: "2 min" },
  { id: 2, type: "tier", message: "Tier 90% atingido WABA-02", workspace: "Cliente B", time: "5 min" },
  { id: 3, type: "429", message: "429 burst detectado", workspace: "Cliente A", time: "8 min" },
]

export function TopBar() {
  const { activeWorkspace, workspaces, loadWorkspaces, switchWorkspace } = useWorkspace();
  
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Use real workspaces or fallback to mock data
  const displayWorkspaces = workspaces.length > 0 ? workspaces : mockWorkspaces;
  const currentWorkspace = activeWorkspace || { name: "Cliente A", id: "1" };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* Sidebar Toggle */}
        <SidebarTrigger className="-ml-1" />

        {/* Workspace Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 px-3 gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="font-medium">{currentWorkspace.name}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {displayWorkspaces.map((workspace) => (
              <DropdownMenuItem 
                key={workspace.id} 
                className="flex items-center gap-2"
                onClick={() => {
                  if (workspaces.length > 0) {
                    switchWorkspace(workspace);
                  }
                }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  (workspace as any).status === 'offline' ? 'bg-muted-foreground' : 'bg-success'
                }`}></div>
                <span>{workspace.name}</span>
                {workspace.id === currentWorkspace.id && (
                  <Badge variant="secondary" className="ml-auto text-xs">Atual</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar campanhas, contatos..."
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Health Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Fila:</span>
            <Badge variant="secondary">1,234</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-muted-foreground">Webhooks</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Saldo:</span>
            <span className="font-medium">R$ 2.847,50</span>
          </div>
        </div>

        {/* Nova Campanha */}
        <Button asChild className="gap-2">
          <Link to="/campaigns/new" aria-label="Nova campanha">
            <Plus className="w-4 h-4" />
            Nova campanha
          </Link>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-[10px] text-destructive-foreground font-medium">{alerts.length}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Alertas Recentes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2 w-full">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.type === '429' ? 'text-destructive' : 
                    alert.type === 'tier' ? 'text-warning' : 'text-muted-foreground'
                  }`} />
                  <span className="font-medium text-sm">{alert.message}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{alert.time}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-6">{alert.workspace}</span>
              </DropdownMenuItem>
            ))}
            {alerts.length === 0 && (
              <DropdownMenuItem disabled>Nenhum alerta recente</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-3 gap-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                JD
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>João da Silva</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}