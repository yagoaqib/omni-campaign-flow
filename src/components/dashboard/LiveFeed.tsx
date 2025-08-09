import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Phone, Clock, CheckCircle, XCircle, Eye } from "lucide-react"

interface Message {
  id: string
  phone: string
  status: "SENT" | "DELIVERED" | "SEEN" | "FAILED"
  timestamp: Date
  campaign: string
  provider: "Infobip" | "Gupshup"
}

const mockMessages: Message[] = [
  {
    id: "1",
    phone: "+55 11 99999-9999",
    status: "SEEN",
    timestamp: new Date(Date.now() - 1000 * 30),
    campaign: "Black Friday Promo",
    provider: "Infobip"
  },
  {
    id: "2", 
    phone: "+55 21 88888-8888",
    status: "DELIVERED",
    timestamp: new Date(Date.now() - 1000 * 45),
    campaign: "Welcome Series",
    provider: "Gupshup"
  },
  {
    id: "3",
    phone: "+55 11 77777-7777", 
    status: "FAILED",
    timestamp: new Date(Date.now() - 1000 * 60),
    campaign: "Newsletter",
    provider: "Infobip"
  },
  {
    id: "4",
    phone: "+55 85 66666-6666",
    status: "SENT",
    timestamp: new Date(Date.now() - 1000 * 75),
    campaign: "Cart Abandonment",
    provider: "Gupshup"
  }
]

export function LiveFeed() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        phone: `+55 11 ${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        status: ["SENT", "DELIVERED", "SEEN", "FAILED"][Math.floor(Math.random() * 4)] as Message["status"],
        timestamp: new Date(),
        campaign: ["Black Friday", "Welcome", "Newsletter", "Cart Recovery"][Math.floor(Math.random() * 4)],
        provider: Math.random() > 0.5 ? "Infobip" : "Gupshup"
      }
      
      setMessages(prev => [newMessage, ...prev.slice(0, 19)]) // Keep last 20
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "SENT": return <Clock className="w-3 h-3" />
      case "DELIVERED": return <CheckCircle className="w-3 h-3" />
      case "SEEN": return <Eye className="w-3 h-3" />
      case "FAILED": return <XCircle className="w-3 h-3" />
    }
  }

  const getStatusColor = (status: Message["status"]) => {
    switch (status) {
      case "SENT": return "bg-muted text-muted-foreground"
      case "DELIVERED": return "bg-primary/10 text-primary"
      case "SEEN": return "bg-success-soft text-success"
      case "FAILED": return "bg-destructive-soft text-destructive"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s atrás`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m atrás`
    const hours = Math.floor(minutes / 60)
    return `${hours}h atrás`
  }

  return (
    <Card className="h-[400px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          Feed ao Vivo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="px-6 space-y-3">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.phone}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(message.status)}`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.status)}
                          {message.status}
                        </div>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{message.campaign}</span>
                      <span>•</span>
                      <span>{message.provider}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {index < messages.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}