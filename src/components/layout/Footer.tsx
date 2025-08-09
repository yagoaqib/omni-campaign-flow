import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="flex h-12 items-center px-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          {/* Provider Status */}
          <div className="flex items-center gap-2">
            <span>Infobip:</span>
            <Badge variant="secondary" className="bg-success-soft text-success text-xs">
              Online
            </Badge>
          </div>
          
          <Separator orientation="vertical" className="h-4" />
          
          <div className="flex items-center gap-2">
            <span>Gupshup:</span>
            <Badge variant="secondary" className="bg-success-soft text-success text-xs">
              Online
            </Badge>
          </div>
          
          <Separator orientation="vertical" className="h-4" />
          
          {/* Webhook Latency */}
          <div className="flex items-center gap-2">
            <span>Webhook:</span>
            <span className="font-medium">~150ms</span>
          </div>
        </div>
        
        {/* Version */}
        <div className="ml-auto flex items-center gap-2">
          <span>v2.1.4</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Build 1234</span>
        </div>
      </div>
    </footer>
  )
}