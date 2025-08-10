import { useState } from "react"
import { 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Users, 
  Phone, 
  TrendingUp, 
  Settings, 
  FileSearch,
  Search,
  Bell,
  ChevronLeft,
  Gauge
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Campanhas", url: "/campaigns", icon: MessageSquare },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Números", url: "/senders", icon: Phone },
  { title: "Performance", url: "/performance", icon: Gauge },
  { title: "Relatórios", url: "/reports", icon: TrendingUp },
]

const adminNavItems = [
  { title: "Integrações", url: "/admin", icon: Settings },
  { title: "Logs", url: "/logs", icon: FileSearch },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavClassName = (path: string) => cn(
    "w-full justify-start transition-colors",
    isActive(path)
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
  )

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarContent className="gap-6">
        {/* Logo */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            {state === "expanded" && (
              <div>
                <h1 className="font-semibold text-sidebar-foreground">OmniFlow</h1>
                <p className="text-xs text-sidebar-foreground/60">Campaign Manager</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}