import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpsTabs } from "@/context/OpsTabsContext";
import { X } from "lucide-react";

export function OpsRibbonTabs() {
  const { tabs, activeId, setActive, closeTab } = useOpsTabs();

  if (tabs.length === 0) return null;

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-10 flex items-center gap-2 px-4 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center gap-2 rounded-md border px-3 h-7 cursor-pointer transition-colors ${
              activeId === tab.id ? "bg-muted" : "hover:bg-muted/50"
            }`}
            onClick={() => setActive(tab.id)}
            role="tab"
            aria-selected={activeId === tab.id}
          >
            <span className="text-sm font-medium whitespace-nowrap">{tab.title}</span>
            <Badge variant={tab.status === "Erro" ? "destructive" : tab.status === "Pausada" ? "outline" : "secondary"} className="text-[10px]">
              {tab.status}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} aria-label="Fechar aba">
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OpsRibbonTabs;
