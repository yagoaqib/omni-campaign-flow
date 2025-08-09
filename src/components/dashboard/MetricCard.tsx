import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    type: "increase" | "decrease" | "neutral"
  }
  icon: LucideIcon
  variant?: "default" | "success" | "warning" | "destructive"
  description?: string
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default",
  description 
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    success: "bg-success-soft border-success",
    warning: "bg-warning-soft border-warning", 
    destructive: "bg-destructive-soft border-destructive"
  }

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive"
  }

  return (
    <Card className={cn("transition-all hover:shadow-soft", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{value}</span>
              {change && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    change.type === "increase" && "bg-success-soft text-success",
                    change.type === "decrease" && "bg-destructive-soft text-destructive",
                    change.type === "neutral" && "bg-muted text-muted-foreground"
                  )}
                >
                  {change.value}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Icon className={cn("w-5 h-5", iconStyles[variant])} />
        </div>
      </CardContent>
    </Card>
  )
}